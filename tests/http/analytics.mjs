import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import process from 'node:process';
import {setTimeout as delay} from 'node:timers/promises';
import {CONSENT_VERSION,DAY} from '../../functions/lib/packages/domain/analytics.js';
const {fetch,AbortSignal}=globalThis;

// Runs only inside the already isolated HTTP quality gate; never starts a service.
export async function analyticsHttpLifecycle({db,buyer,manager,passwordUser,command,payload}) {
  assert.equal(process.env.GCLOUD_PROJECT,'demo-satsunicgo');
  assert.equal(process.env.FUNCTIONS_EMULATOR,'true');
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9198');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8181');
  const base='http://127.0.0.1:5101/demo-satsunicgo/asia-southeast1/';
  async function call(name,token,data){
    const response=await fetch(base+name,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({data}),signal:AbortSignal.timeout(30_000)});
    return {status:response.status,body:await response.json()};
  }
  async function eventually(read,ready){
    const until=Date.now()+60_000;
    while(Date.now()<until){const result=await read();if(ready(result))return result;await delay(500);}
    throw Error('ANALYTICS_HTTP_TRIGGER_TIMEOUT');
  }
  const consent=()=>({version:1,consent:CONSENT_VERSION,browserId:randomUUID(),requestId:randomUUID()});
  const policy=db.doc('analyticsConfig/current'),access=db.doc(`staffAccess/${manager.localId}`),productId=`http-analytics-${randomUUID()}`;
  assert.equal((await policy.get()).exists,false,'Isolated fixture must own its analytics policy');
  assert.equal((await access.get()).exists,false,'Fixture must not overwrite staff access');
  const disabled=await call('analyticsSession',buyer.idToken,consent());
  assert.equal(disabled.body.error?.status,'FAILED_PRECONDITION');
  try {
    await policy.set({enabled:true,startedAt:Date.now()});
    const wrongProvider=await call('analyticsSession',passwordUser.idToken,consent());
    assert.equal(wrongProvider.body.error?.status,'PERMISSION_DENIED');
    const guest=await call('analyticsSession',null,consent());
    assert.equal(guest.status,200);
    assert.equal((await call('analyticsWithdraw',null,{session:guest.body.result.session,reason:'withdraw'})).body.result.stopped,true);
    await db.doc(`products/${productId}`).set({status:'published',publishAt:0,title:'HTTP analytics fixture',slug:productId});
    const request=consent(),opened=await call('analyticsSession',buyer.idToken,request);
    assert.equal(opened.status,200);
    const session=opened.body.result.session;
    const reopened=await call('analyticsSession',buyer.idToken,request);
    assert.equal(reopened.status,200);
    const capability=token=>db.doc(`analyticsCapabilities/${createHash('sha256').update(token).digest('hex')}`).get();
    assert.equal((await capability(session)).data().sessionId,(await capability(reopened.body.result.session)).data().sessionId);
    const events=[{id:randomUUID(),at:Date.now(),kind:'page',route:'home'},{id:randomUUID(),at:Date.now(),kind:'product_click',productId},{id:randomUUID(),at:Date.now(),kind:'ask',topic:'shipping'}];
    const batch={version:1,session,events};
    assert.equal((await call('analyticsIngest',buyer.idToken,batch)).body.result.accepted,3);
    assert.equal((await call('analyticsIngest',buyer.idToken,batch)).body.result.accepted,0);
    const created=await command(buyer.idToken,{action:'submitRequest',operationId:randomUUID(),payload});
    assert.equal(created.status,200);
    const orderId=created.body.result.id;
    assert.equal((await call('analyticsLinkOrder',manager.idToken,{session,orderId})).body.error?.status,'PERMISSION_DENIED');
    const foreign=await command(manager.idToken,{action:'submitRequest',operationId:randomUUID(),payload});
    assert.equal(foreign.status,200);
    assert.equal((await call('analyticsLinkOrder',buyer.idToken,{session,orderId:foreign.body.result.id})).body.error?.status,'PERMISSION_DENIED');
    assert.equal((await call('analyticsLinkOrder',buyer.idToken,{session,orderId})).body.result.linked,true);
    await db.doc(`financialEntries/http-${randomUUID()}`).set({orderId,kind:'payment',amount:100,currency:'VND',createdAt:Date.now()});
    const attribution=(await db.doc(`analyticsAttributions/${orderId}`).get()).data();
    await eventually(()=>db.doc(`analyticsSessions/${attribution.sessionId}`).get(),snapshot=>snapshot.data()?.convertedOrders===1);
    await eventually(()=>db.collection('analyticsJobs').where('state','==','pending').get(),snapshot=>snapshot.empty);
    await access.set({active:true,locked:false,roles:['OWNER']});
    const from=Math.floor(Date.now()/DAY)*DAY,until=Date.now();
    const denied=await call('dashboardAnalytics',buyer.idToken,{from,until});
    assert.equal(denied.body.error?.status,'PERMISSION_DENIED');
    const result=await call('dashboardAnalytics',manager.idToken,{from,until});
    assert.equal(result.status,200);
    const snapshot=result.body.result;
    assert.equal(snapshot.buyers,1);
    assert.equal(snapshot.convertedSessions,1);
    assert.equal(snapshot.products.find(row=>row.id===productId)?.clicks,1);
    assert.equal(snapshot.days.reduce((n,day)=>n+(day.counts.views??0),0),1);
    assert.equal(snapshot.days.reduce((n,day)=>n+(day.counts.questions??0),0),1);
    assert.deepEqual(snapshot.topics,[],'One-session topic remains below publication threshold');
    assert.equal(snapshot.days.reduce((n,day)=>n+(day.counts.payments??0),0),100);
    assert.equal(snapshot.deadLetters,0);
    assert.equal((await call('analyticsWithdraw',buyer.idToken,{session,reason:'withdraw'})).body.result.stopped,true);
    assert.equal((await call('analyticsIngest',buyer.idToken,{...batch,events:[{id:randomUUID(),at:Date.now(),kind:'page',route:'home'}]})).body.error?.status,'FAILED_PRECONDITION');
  } finally {
    await policy.set({enabled:false},{merge:true});
    await access.delete();
    await db.doc(`products/${productId}`).delete();
  }
}
