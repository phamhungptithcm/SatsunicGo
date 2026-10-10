import {initializeApp,deleteApp} from '/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-admin/lib/app/index.js';
import {getFirestore} from '/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-admin/lib/firestore/index.js';
import {getStorage} from '/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-admin/lib/storage/index.js';
import {getAuth} from '/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-admin/lib/auth/index.js';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const root='/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo';
if(process.env.GCLOUD_PROJECT!=='demo-satsunicgo'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:18207'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:19207'||process.env.FIREBASE_STORAGE_EMULATOR_HOST!=='127.0.0.1:19208')throw Error('DEMO_ONLY_EXACT_HOSTS_REQUIRED');
const metadata='/private/tmp/satsunicgo-post-image-ui-fixture.json';
const app=initializeApp({projectId:'demo-satsunicgo',storageBucket:'demo-satsunicgo.appspot.com'}),db=getFirestore(app),bucket=getStorage(app).bucket();
try{
 if(process.argv[2]==='create'){
  if(existsSync(metadata))throw Error('FIXTURE_METADATA_EXISTS');
  const id='qa-img-'+randomUUID(),mediaId='qa-img-media-'+randomUUID(),title='QA ảnh tích hợp · sản phẩm giả',email=id+'@satsunicgo.example.invalid',objectPath='qa-post-image/'+id+'/portrait.png';
  await bucket.file(objectPath).save(readFileSync(root+'/tests/browser/fixtures/product-image-framing/assets/portrait.png'),{contentType:'image/png'});
  await db.doc('products/'+id).create({title,slug:id,status:'published',market:'US',version:1,orderable:true,listedPrice:250000,termsVersion:'qa-image-only',catalogOptions:[],mediaId,mediaAlt:'Ảnh giả kiểm thử tỷ lệ dọc'});
  await db.doc('contentMedia/'+mediaId).create({contentKind:'products',contentId:id,objectPath,mime:'image/png'});
  const m={at:new Date().toISOString(),project:'demo-satsunicgo',id,mediaId,title,email,objectPath,origin:'http://localhost:5207',ordersCreated:0};
  writeFileSync(metadata,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify(m));
 }else if(['break','restore'].includes(process.argv[2])){
  const m=JSON.parse(readFileSync(metadata,'utf8'));if(m.project!=='demo-satsunicgo'||!/^qa-img-[0-9a-f-]+$/.test(m.id))throw Error('OWNERSHIP_GUARD');
  const ref=db.doc('contentMedia/'+m.mediaId),row=await ref.get();if(row.data()?.contentId!==m.id)throw Error('MEDIA_GUARD');
  await ref.update({objectPath:process.argv[2]==='break'?m.objectPath+'.missing':m.objectPath});console.log('Owned synthetic media '+process.argv[2]);
 }else if(process.argv[2]==='cleanup'){
  const m=JSON.parse(readFileSync(metadata,'utf8'));if(m.project!=='demo-satsunicgo'||!/^qa-img-[0-9a-f-]+$/.test(m.id)||m.email!==m.id+'@satsunicgo.example.invalid'||m.objectPath!=='qa-post-image/'+m.id+'/portrait.png')throw Error('OWNERSHIP_GUARD');
  const p=await db.doc('products/'+m.id).get();if(p.exists&&p.data().slug!==m.id)throw Error('PRODUCT_GUARD');
  let user;try{user=await getAuth(app).getUserByEmail(m.email);}catch(e){if(e.code!=='auth/user-not-found')throw e;}
  let ownedOrders=0,keys=0;
  if(user){
   ownedOrders=(await db.collection('orders').where('ownerId','==',user.uid).get()).size;if(ownedOrders)throw Error('UNEXPECTED_ORDER_NO_CLEANUP');
   const cart=await db.doc('carts/'+user.uid).get();if(cart.exists&&(cart.data().items??[]).some(x=>x.productId&&x.productId!==m.id))throw Error('UNEXPECTED_CART_ITEM');
   for(const collection of ['purchasePreviews','purchaseDrafts']){const owned=await db.collection(collection).where('ownerId','==',user.uid).get();for(const x of owned.docs){if(x.data().ownerId!==user.uid)throw Error('OWNER_GUARD');await x.ref.delete();}}
   for(const collection of ['users','carts'])await db.doc(collection+'/'+user.uid).delete();
   for(const kind of ['cart','purchase']){const prefix=kind+'-'+user.uid+'-';const k=await db.collection('idempotencyKeys').orderBy('__name__').startAt(prefix).endAt(prefix+'\uf8ff').get();for(const x of k.docs){if(!x.id.startsWith(prefix))throw Error('KEY_GUARD');await x.ref.delete();keys++;}}
   await getAuth(app).deleteUser(user.uid);
  }
  await db.doc('contentMedia/'+m.mediaId).delete();await db.doc('products/'+m.id).delete();await bucket.file(m.objectPath).delete({ignoreNotFound:true});
  const out={at:new Date().toISOString(),status:'PASSED',ownedProductRemoved:!(await db.doc('products/'+m.id).get()).exists,ownedMediaRemoved:!(await db.doc('contentMedia/'+m.mediaId).get()).exists,ownedAuthRemoved:!!user,ownedOrders,keysRemoved:keys,sharedAccountsTouched:false,sharedSettingsTouched:false};
  writeFileSync('/private/tmp/satsunicgo-post-image-ui-cleanup.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
 }else throw Error('MODE_REQUIRED');
}finally{await deleteApp(app);}
