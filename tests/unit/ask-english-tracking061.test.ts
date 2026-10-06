import {test} from "vitest";
import assert from "node:assert/strict";
import {explicitOrderReferences,preferredLanguage,productQuery,searchViews} from "../../packages/domain/ask-language-query";
import {extractOrderTrackingIntent} from "../../packages/domain/order-tracking";
import {catalogSearchIntent} from "../../packages/domain/catalog-search";
import {collectReadFrame,canonicalFrameDetectors} from "../../packages/domain/ask-task-frame";
import {customerChatAction} from "../../packages/domain/chat-action";
import {shippingQuestionDirection} from "../../src/features/ask/ShippingQuote";
// Exact source-bound Ask actionOrAmbiguity excerpt; immutable mapping in English061 evidence.
const commerce={order:null,draft:null};
const actualAskGuard:(raw:string)=>boolean=(raw) => {
                const folded = searchViews(raw).folded;
                return (
                  !!customerChatAction(raw, commerce.order, commerce.draft) ||
                  /\b(?:thanh toan|tra tien|chuyen tien|chuyen khoan|mua|dat hang|bo vao gio|them vao gio|add to cart|gui yeu cau|chap nhan|duyet|xac nhan|huy don|hoan tien|payment|pay|purchase|checkout|buy|submit|accept|approve|confirm|cancel|refund)\b/u.test(
                    folded,
                  )
                );
              };
const detectors=canonicalFrameDetectors({tracking:extractOrderTrackingIntent,catalog:catalogSearchIntent,product:productQuery,direction:shippingQuestionDirection,actionOrAmbiguity:actualAskGuard});
const frame=(raw:string)=>collectReadFrame(raw,detectors);
const id="ask049-order-123e4567-e89b-12d3-a456-426614174000";
const mixed=`track order ${id}, find askfixtureletters and shipping from USA to Vietnam 1kg`;
test("English track-order mixed goals retain exact identifier/raw spans and English",()=>{const f=frame(mixed);assert.deepEqual(f.tasks.map(t=>t.kind),["tracking","catalog","fees"]);assert.equal(f.requiresClarification,false);assert.ok(f.tasks[0].kind==="tracking");assert.equal(f.tasks[0].params.orderId,id);for(const t of f.tasks)assert.equal(t.span.raw,mixed.slice(t.span.start,t.span.end));assert.equal(preferredLanguage(mixed,"vi"),"en");});
test("English tracking variants retain original case and punctuation",()=>{for(const q of ["track order: AbC-123","track my order #AbC-123","TRACK ORDER AbC-123."])assert.deepEqual(explicitOrderReferences(q),["AbC-123"]);});
test("invalid whole tokens and missing tracking IDs clarify",()=>{for(const token of ["ABC_123","ＡBC-123","ABC-１２３","ABC-123４","ABC-123é","ABC-123\u0301","a".repeat(79)+"-1",""]){const raw="track order "+token;assert.deepEqual(explicitOrderReferences(raw),[]);const f=frame(raw);assert.equal(f.tasks.length,0);assert.equal(f.requiresClarification,true);assert.equal(f.unresolved[0].reason,"tracking-id-required");assert.equal(f.unresolved[0].raw,raw);}});
test("ASCII80 IDs and keyword IDs remain exact",()=>{for(const token of ["A".repeat(78)+"-1","track-42","search-42","find-42"])assert.deepEqual(explicitOrderReferences("track order "+token),[token]);});
test("multi and duplicate references require clarification",()=>{for(const raw of ["track order ABC-123 and track my order DEF-456","track order ABC-123 and track my order ABC-123"]){const f=frame(raw);assert.equal(f.tasks.length,0);assert.equal(f.requiresClarification,true);assert.equal(f.unresolved[0].raw,raw);}});
test("generic brand/embedded tracking words do not infer identifiers",()=>{for(const q of ["Order cream","order me cream","place order me cream","soundtrack order ABC-123","retrack order ABC-123","＿track order ABC-123"])assert.deepEqual(explicitOrderReferences(q),[]);});
test("actual money guard and unsupported tails keep read dispatch closed",()=>{for(const tail of ["buy cream","pay order","refund order","place order cream","order me cream"]){const raw=mixed+", "+tail;const f=frame(raw);assert.equal(f.requiresClarification,true);assert.equal(f.raw,raw);}});
test("explicit language and Vietnamese precedence stay intact",()=>{assert.equal(preferredLanguage(mixed+" answer in Vietnamese","en"),"vi");assert.equal(preferredLanguage(mixed+" answer in English cho chị","vi"),"en");assert.equal(preferredLanguage("track order ABC-123 giúp chị","en"),"vi");assert.equal(preferredLanguage("find CeraVe moisturizer","vi"),"vi");});

test("new tracking aliases require a delimiter after order",()=>{for(const q of ["track orderABC-123","track my orderABC-123","track orderbook-123","track my orderbook-123"]){assert.deepEqual(explicitOrderReferences(q),[]);assert.equal(detectors.explicitReadStart(q),false);}});
test("colon and hash delimiters preserve exact new tracking references",()=>{for(const q of ["track order:ABC-123","track order#ABC-123","track my order:ABC-123","track my order#ABC-123"]){assert.deepEqual(explicitOrderReferences(q),["ABC-123"]);assert.equal(detectors.explicitReadStart(q),true);const f=frame("find cream and "+q);assert.deepEqual(f.tasks.map(t=>t.kind),["catalog","tracking"]);assert.equal(f.requiresClarification,false);}});
