# Sandbox secret registration fix

Normal release38007935994 built v0.8.0 successfully but Firebase discovery required an emulator-only IPN secret in production. The SDK globally registers defineSecret calls from reachable imports even without endpoint secret bindings.

Register sandbox parameters only in the exact existing demo emulator, retain runtime project/database guards, and fail closed when a binding is absent. No secrets were read or created; no provider was called. 111 focused tests and both strict checks/lint pass; actual compiled SDK discovery reports zero sandbox parameters in production. Full new release remains pending.

The subsequent human request to run sandbox in production needs a separate test-mode delta with HTTPS callbacks and financial isolation; this fix does not activate it.
