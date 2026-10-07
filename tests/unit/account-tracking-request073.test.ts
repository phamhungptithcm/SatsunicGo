import { expect, test } from 'vitest';
import { AccountTrackingRequest } from '../../src/features/orders/account-tracking-request';
const dto = { orderId:'A', stage:'IN_TRANSIT', purchaseKind:'catalog', version:4, observedAt:1000, onHold:false, timeline:[], timelinePartial:false, shipments:[], shipmentsPartial:false, estimate:null };
function harness() {
  const request=new AccountTrackingRequest(), rows:unknown[]=[], errors:string[]=[];
  let uid='owner';
  const run=(read:()=>Promise<unknown>, orderId='A', version=4)=>request.run({orderId,version,owns:()=>uid==='owner',read,success:v=>rows.push(v),failure:()=>errors.push('failed')});
  return {request,rows,errors,run,setUid:(value:string)=>{uid=value;}};
}
function deferred(){let resolve!:(value:unknown)=>void;const promise=new Promise<unknown>(r=>{resolve=r;});return {promise,resolve};}
test('validated private projection and null ETA accepted',async()=>{const h=harness();await h.run(async()=>dto);expect(h.rows).toEqual([dto]);expect(h.errors).toEqual([]);});
test('null malformed and invalid date DTO recover through error',async()=>{for(const value of [null,{}, {...dto,observedAt:Infinity},{...dto,timeline:[{action:'track',createdAt:9e16}]},{...dto,shipments:null}]){const h=harness();await h.run(async()=>value);expect(h.rows).toEqual([]);expect(h.errors).toEqual(['failed']);}});
test('wrong order and stale version rejected',async()=>{for(const value of [{...dto,orderId:'B'},{...dto,version:3}]){const h=harness();await h.run(async()=>value);expect(h.rows).toEqual([]);expect(h.errors).toEqual(['failed']);}});
test('UID mismatch never issues read',async()=>{const h=harness();h.setUid('other');let reads=0;await h.run(async()=>{reads++;return dto;});expect(reads).toBe(0);});
test('late read after logout cannot publish',async()=>{const h=harness(),a=deferred();const run=h.run(()=>a.promise);h.setUid('other');a.resolve(dto);await run;expect(h.rows).toEqual([]);expect(h.errors).toEqual([]);});
test('A B A latest selection owns response, including late errors',async()=>{const h=harness(),a=deferred(),b=deferred();const first=h.run(()=>a.promise);const second=h.run(()=>b.promise,'B');await h.run(async()=>({...dto,version:5}));a.resolve(dto);b.resolve(null);await Promise.all([first,second]);expect(h.rows).toEqual([{...dto,version:5}]);expect(h.errors).toEqual([]);});
test('unmount or version retry invalidates old operation',async()=>{const h=harness(),a=deferred();const first=h.run(()=>a.promise);h.request.invalidate();a.resolve(dto);await first;expect(h.rows).toEqual([]);await h.run(async()=>({...dto,version:6}),'A',6);expect(h.rows).toEqual([{...dto,version:6}]);});
test('offline timeout denied read recovers and can retry',async()=>{const h=harness();await h.run(async()=>{throw Error('offline');});expect(h.errors).toEqual(['failed']);await h.run(async()=>dto);expect(h.rows).toEqual([dto]);});
