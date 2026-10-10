import { initializeApp, deleteApp } from '/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-admin/lib/app/index.js';
import { getFirestore } from '/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-admin/lib/firestore/index.js';
import { getAuth } from '/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-admin/lib/auth/index.js';
import { getStorage } from '/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-admin/lib/storage/index.js';
import { readFileSync, writeFileSync } from 'node:fs';
const required = {GCLOUD_PROJECT:'demo-satsunicgo', FIRESTORE_EMULATOR_HOST:'127.0.0.1:18207', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19207', FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:19208'};
for (const [key,value] of Object.entries(required)) if(process.env[key] !== value) throw Error('EXACT_DEMO_HOSTS_REQUIRED');
const m = JSON.parse(readFileSync('/private/tmp/satsunicgo-post-image-ui-fixture.json','utf8'));
if(m.project !== 'demo-satsunicgo' || !/^qa-img-[0-9a-f-]+$/.test(m.id) || m.email !== m.id+'@satsunicgo.example.invalid' || m.objectPath !== 'qa-post-image/'+m.id+'/portrait.png') throw Error('OWNED_FIXTURE_REQUIRED');
const app = initializeApp({projectId:'demo-satsunicgo',storageBucket:'demo-satsunicgo.appspot.com'});
try {
 const db = getFirestore(app);
 let authAbsent = false;
 try { await getAuth(app).getUserByEmail(m.email); } catch (error) { if(error.code !== 'auth/user-not-found') throw error; authAbsent = true; }
 const [product,media,stored] = await Promise.all([db.doc('products/'+m.id).get(), db.doc('contentMedia/'+m.mediaId).get(), getStorage(app).bucket().file(m.objectPath).exists()]);
 const out = {at:new Date().toISOString(),mode:'READ_ONLY_EXACT_OWNED_FIXTURE',project:'demo-satsunicgo',ownedProductAbsent:!product.exists,ownedMediaAbsent:!media.exists,ownedAuthAbsent:authAbsent,ownedStorageAbsent:!stored[0],mutations:0,scopeLimit:'Owned account/cart/previews/drafts/key delete calls fulfilled in original cleanup; post-delete account UID was not retained so no later query/readback of those account-scoped collections is claimed.'};
 out.status = out.ownedProductAbsent && out.ownedMediaAbsent && out.ownedAuthAbsent && out.ownedStorageAbsent ? 'PASSED_SCOPED_CLEANUP_READBACK' : 'FAILED';
 writeFileSync('/private/tmp/satsunicgo-post-image-ui-cleanup-readback.json',JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify(out));
 if(out.status === 'FAILED') process.exitCode = 1;
} finally { await deleteApp(app); }
