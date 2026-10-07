# ASK106 recent MFA recovery delta

Status AWAITING APPROVAL. User screenshot confirms pilotenable rejected despite providerready and unusedbudget. Serverowner gate requires recentMFA under5minutes; productionSecurity hides reauthaction when enrolledFactors>0. Genericpiloterror conflates owneraccess and recency. IntelligenceDEGRADED:CodeGraph stale,CocoIndex stale/unhealthy; boundedactualsource and deployedcandidate inspected. SharedHEADhas changed and unrelatedauthWIP must remain excluded.

Smallestfix: only AskPilot.tsx add explicit manual Google reauthentication action using existing auth/currentUser, reauthenticateWithPopup, captureMfa and existing globallymounted LoginChallenge. Never weaken serverguard or enroll/resetfactors. On MFAcompletion refresh token and permit explicitpilotconfirm again; do not autoenable. Cancel/expired/wrongcode handling reuse existingchallenge. Distinguish authrecoverycopy from unknownwrite outcomes. No token/OTPlogging, no storedcredentials, no privateproviderdata.

Files:src/features/settings/AskPilot.tsx,ask-pilot106.css; focusedbrowser/unit tests; productreview and finalreviewdocs. No broadSecurity/LoginChallenge/MFAWIP release. Isolatedcandidate based22214plus reviewedASK106changes. Confirm challenge mount in candidate beforeedit; if absent documentdelta before implementation.

Risk: authentication recovery path; Googlepopup mobile policy, missingMFA, cancellation and currentUIDchange. Guard mounted/stale callbacks and repeatclick; no automaticwrite. Existing5minute serverrequirement preserved.

Verify actualcomponent desktop/mobile button/challenge/cancel/focus/denial; mockedSDKcorrect recovery state; build/lint and freshfinalreview. Hostingonly deployment preserving allpreviousassets; productionreauth UI then humanOTPentry, confirmedowneractivation, oneboundedpaidtrial and actualscreenshot. Usermust personallyenterOTP; agentcannot inventor retrievecredential. Rollback previousHostingversion; pilotremainsdisableduntilnormalcommand success.
