//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.for("react.view_transition"), m = Symbol.iterator;
	function h(e) {
		return typeof e != "object" || !e ? null : (e = m && e[m] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var g = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, _ = Object.assign, v = {};
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	y.prototype.isReactComponent = {}, y.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, y.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function b() {}
	b.prototype = y.prototype;
	function ee(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	var te = ee.prototype = new b();
	te.constructor = ee, _(te, y.prototype), te.isPureReactComponent = !0;
	var x = Array.isArray;
	function S() {}
	var C = {
		H: null,
		A: null,
		T: null,
		S: null
	}, ne = Object.prototype.hasOwnProperty;
	function w(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function re(e, t) {
		return w(e.type, t, e.props);
	}
	function ie(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function ae(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var oe = /\/+/g;
	function se(e, t) {
		return typeof e == "object" && e && e.key != null ? ae("" + e.key) : t.toString(36);
	}
	function ce(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(S, S) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function le(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, le(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + se(e, 0) : a, x(o) ? (i = "", c != null && (i = c.replace(oe, "$&/") + "/"), le(o, r, i, "", function(e) {
			return e;
		})) : o != null && (ie(o) && (o = re(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(oe, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (x(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + se(a, u), c += le(a, r, i, s, o);
		else if (u = h(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + se(a, u++), c += le(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return le(ce(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function ue(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return le(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function de(e) {
		if (e._status === -1) {
			var t = e._result, n = t();
			n.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t, n.status === void 0 && (n.status = "fulfilled", n.value = t));
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t, n.status === void 0 && (n.status = "rejected", n.reason = t));
			}), e._status === -1 && (e._status = 0, e._result = n);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var fe = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	};
	function pe(e) {
		var t = C.T, n = {};
		n.types = t === null ? null : t.types, C.T = n;
		try {
			var r = e(), i = C.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(S, fe);
		} catch (e) {
			fe(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), C.T = t;
		}
	}
	function me(e) {
		var t = C.T;
		if (t !== null) {
			var n = t.types;
			n === null ? t.types = [e] : n.indexOf(e) === -1 && n.push(e);
		} else pe(me.bind(null, e));
	}
	var he = {
		map: ue,
		forEach: function(e, t, n) {
			ue(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return ue(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return ue(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!ie(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = he, e.Component = y, e.Fragment = r, e.Profiler = a, e.PureComponent = ee, e.StrictMode = i, e.Suspense = l, e.ViewTransition = p, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = C, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return C.H.useMemoCache(e);
		}
	}, e.addTransitionType = me, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = _({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !ne.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return w(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) ne.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return w(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = ie, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: de
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = pe, e.unstable_useCacheRefresh = function() {
		return C.H.useCacheRefresh();
	}, e.use = function(e) {
		return C.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return C.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return C.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return C.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return C.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return C.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return C.H.useEffectEvent(e);
	}, e.useId = function() {
		return C.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return C.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return C.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return C.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return C.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return C.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return C.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return C.H.useRef(e);
	}, e.useState = function(e) {
		return C.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return C.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return C.H.useTransition();
	}, e.version = "19.3.0";
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function ee(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, te || (te = !0, re());
			else {
				var t = n(l);
				t !== null && oe(ee, t.startTime - e);
			}
		}
	}
	var te = !1, x = -1, S = 5, C = -1;
	function ne() {
		return g ? !0 : !(e.unstable_now() - C < S);
	}
	function w() {
		if (g = !1, te) {
			var t = e.unstable_now();
			C = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(x), x = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && ne());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && oe(ee, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? re() : te = !1;
			}
		}
	}
	var re;
	if (typeof y == "function") re = function() {
		y(w);
	};
	else if (typeof MessageChannel < "u") {
		var ie = new MessageChannel(), ae = ie.port2;
		ie.port1.onmessage = w, re = function() {
			ae.postMessage(null);
		};
	} else re = function() {
		_(w, 0);
	};
	function oe(t, n) {
		x = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : S = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(x), x = -1) : h = !0, oe(ee, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, te || (te = !0, re()))), r;
	}, e.unstable_shouldYield = ne, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = u();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal"), o = Symbol.for("react.recoverable"), s = Symbol.for("react.optimistic_key");
	function c(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : r === s ? s : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var l = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function d(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.browser = function(e) {
		return {
			$$typeof: o,
			_reason: e
		};
	}, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return c(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = l.T, n = i.p;
		try {
			if (l.T = null, i.p = 2, e) return e();
		} finally {
			l.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = d(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") {
			if (typeof t == "object" && t) {
				if (t.as == null || t.as === "script") {
					var n = d(t.as, t.crossOrigin);
					i.d.M(e, {
						crossOrigin: n,
						integrity: typeof t.integrity == "string" ? t.integrity : void 0,
						nonce: typeof t.nonce == "string" ? t.nonce : void 0,
						fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
					});
				}
			} else t ?? i.d.M(e);
		}
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = d(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") {
			if (t) {
				var n = d(t.as, t.crossOrigin);
				i.d.m(e, {
					as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0,
					fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
				});
			} else i.d.m(e);
		}
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return l.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return l.H.useHostTransitionStatus();
	}, e.version = "19.3.0";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = f(), n = u(), r = m();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		for (var t = e, n = t; n && !n.alternate;) t = n, t.flags & 4098 && (e = t.return), n = t.return;
		for (; t.return;) t = t.return;
		return t.tag === 3 ? e : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	function h(e, t, n, r, i, a) {
		for (; e !== null;) {
			if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && n(e, r, i, a) || (e.tag !== 22 || e.memoizedState === null) && (t || e.tag !== 5 && e.tag !== 27) && h(e.child, t, n, r, i, a)) return !0;
			e = e.sibling;
		}
		return !1;
	}
	function g(e) {
		for (e = e.return; e !== null;) {
			if (e.tag === 3 || e.tag === 5 || e.tag === 27) return e;
			e = e.return;
		}
		return null;
	}
	function _(e) {
		var t = !1;
		for (e = e.return; e !== null && (e.tag === 4 && (t = !0), e.tag !== 3 && e.tag !== 5 && e.tag !== 27);) e = e.return;
		return t;
	}
	function v(e) {
		var t = [null, null], n = g(e);
		return n === null || y(t, e, n.child, { foundSelf: !1 }), t;
	}
	function y(e, t, n, r) {
		for (; n !== null;) {
			if (n === t) r.foundSelf = !0;
			else if (n.tag === 5 || n.tag === 27 || n.tag === 6) {
				if (r.foundSelf) return e[1] = n, !0;
				e[0] = n;
			} else if ((n.tag !== 22 || n.memoizedState === null) && y(e, t, n.child, r)) return !0;
			n = n.sibling;
		}
		return !1;
	}
	function b(e) {
		switch (e.tag) {
			case 5:
			case 27:
			case 6: return e.stateNode;
			case 3: return e.stateNode.containerInfo;
			default: throw Error(i(559));
		}
	}
	var ee = null, te = null;
	function x(e, t, n) {
		return e === n || e === t && (ee = e, !0);
	}
	function S(e, t, n) {
		return e === n ? (te = e, !1) : e === t && (te !== null && (ee = e), !0);
	}
	function C(e) {
		if (e === null) return null;
		do
			e = e === null ? null : e.return;
		while (e && e.tag !== 5 && e.tag !== 27 && e.tag !== 3);
		return e || null;
	}
	function ne(e, t, n) {
		for (var r = 0, i = e; i; i = n(i)) r++;
		i = 0;
		for (var a = t; a; a = n(a)) i++;
		for (; 0 < r - i;) e = n(e), r--;
		for (; 0 < i - r;) t = n(t), i--;
		for (; r--;) {
			if (e === t || t !== null && e === t.alternate) return e;
			e = n(e), t = n(t);
		}
		return null;
	}
	var w = Object.assign, re = Symbol.for("react.element"), ie = Symbol.for("react.transitional.element"), ae = Symbol.for("react.portal"), oe = Symbol.for("react.fragment"), se = Symbol.for("react.strict_mode"), ce = Symbol.for("react.profiler"), le = Symbol.for("react.consumer"), ue = Symbol.for("react.context"), de = Symbol.for("react.forward_ref"), fe = Symbol.for("react.suspense"), pe = Symbol.for("react.suspense_list"), me = Symbol.for("react.memo"), he = Symbol.for("react.lazy"), ge = Symbol.for("react.activity"), _e = Symbol.for("react.legacy_hidden"), ve = Symbol.for("react.memo_cache_sentinel"), ye = Symbol.for("react.view_transition"), be = Symbol.for("react.recoverable"), xe = Symbol.iterator;
	function Se(e) {
		return typeof e != "object" || !e ? null : (e = xe && e[xe] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var Ce = Symbol.for("react.client.reference");
	function we(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === Ce ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case oe: return "Fragment";
			case ce: return "Profiler";
			case se: return "StrictMode";
			case fe: return "Suspense";
			case pe: return "SuspenseList";
			case ge: return "Activity";
			case ye: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case ae: return "Portal";
			case ue: return e.displayName || "Context";
			case le: return (e._context.displayName || "Context") + ".Consumer";
			case de:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case me: return t = e.displayName || null, t === null ? we(e.type) || "Memo" : t;
			case he:
				t = e._payload, e = e._init;
				try {
					return we(e(t));
				} catch {}
		}
		return null;
	}
	var Te = Array.isArray, T = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, E = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, Ee = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, De = [], Oe = -1;
	function ke(e) {
		return { current: e };
	}
	function D(e) {
		0 > Oe || (e.current = De[Oe], De[Oe] = null, Oe--);
	}
	function O(e, t) {
		Oe++, De[Oe] = e.current, e.current = t;
	}
	var Ae = ke(null), je = ke(null), Me = ke(null), Ne = ke(null);
	function Pe(e, t) {
		switch (O(Me, t), O(je, e), O(Ae, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? up(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = up(t), e = dp(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		D(Ae), O(Ae, e);
	}
	function Fe() {
		D(Ae), D(je), D(Me);
	}
	function Ie(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, O(Ne, e)), t = Ae.current;
		var n = dp(t, e.type);
		t !== n && (O(je, e), O(Ae, n));
	}
	function Le(e) {
		je.current === e && (D(Ae), D(je)), Ne.current === e && (D(Ne), sh._currentValue = Ee);
	}
	var Re, ze;
	function Be(e) {
		if (Re === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			Re = t && t[1] || "", ze = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + Re + e + ze;
	}
	var Ve = !1;
	function He(e, t) {
		if (!e || Ve) return "";
		Ve = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							n = !1;
							try {
								var i = Object.getOwnPropertyDescriptor(e.prototype, "props");
								Object.defineProperty(e.prototype, "props", {
									configurable: !0,
									set: function() {
										throw Error();
									}
								}), n = !0, new e();
							} finally {
								n && (i === void 0 ? delete e.prototype.props : Object.defineProperty(e.prototype, "props", i));
							}
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			Ve = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? Be(n) : "";
	}
	function Ue(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return Be(e.type);
			case 16: return Be("Lazy");
			case 13: return e.child !== t && t !== null ? Be("Suspense Fallback") : Be("Suspense");
			case 19: return Be("SuspenseList");
			case 0:
			case 15: return He(e.type, !1);
			case 11: return He(e.type.render, !1);
			case 1: return He(e.type, !0);
			case 31: return Be("Activity");
			case 30: return Be("ViewTransition");
			default: return "";
		}
	}
	function We(e) {
		try {
			var t = "", n = null;
			do
				t += Ue(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var Ge = Object.prototype.hasOwnProperty, Ke = t.unstable_scheduleCallback, qe = t.unstable_cancelCallback, Je = t.unstable_shouldYield, Ye = t.unstable_requestPaint, Xe = t.unstable_now, Ze = t.unstable_getCurrentPriorityLevel, Qe = t.unstable_ImmediatePriority, $e = t.unstable_UserBlockingPriority, et = t.unstable_NormalPriority, tt = t.unstable_LowPriority, nt = t.unstable_IdlePriority, rt = t.log, it = t.unstable_setDisableYieldValue, at = null, ot = null;
	function st(e) {
		if (typeof rt == "function" && it(e), ot && typeof ot.setStrictMode == "function") try {
			ot.setStrictMode(at, e);
		} catch {}
	}
	var ct = Math.clz32 ? Math.clz32 : dt, lt = Math.log, ut = Math.LN2;
	function dt(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (lt(e) / ut | 0) | 0;
	}
	var ft = 256, pt = 262144, mt = 4194304;
	function ht(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & -e;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function gt(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = ht(n))) : i = ht(o) : i = ht(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = ht(n))) : i = ht(o)) : i = ht(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function _t(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function vt(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - ct(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function yt(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function bt() {
		var e = mt;
		return mt <<= 1, !(mt & 62914560) && (mt = 4194304), e;
	}
	function xt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function St(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function Ct(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - ct(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && wt(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function wt(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - ct(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function Tt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - ct(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function Et(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : Dt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function Dt(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function Ot(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function kt() {
		var e = E.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function At(e, t) {
		var n = E.p;
		try {
			return E.p = e, t();
		} finally {
			E.p = n;
		}
	}
	var jt = Math.random().toString(36).slice(2), Mt = "__reactFiber$" + jt, Nt = "__reactProps$" + jt, Pt = "__reactContainer$" + jt, Ft = "__reactEvents$" + jt, It = "__reactListeners$" + jt, Lt = "__reactHandles$" + jt, Rt = "__reactResources$" + jt, zt = "__reactMarker$" + jt, Bt = "__reactLoad$" + jt;
	function Vt(e) {
		delete e[Mt], delete e[Nt], delete e[It], delete e[Lt];
	}
	function Ht(e) {
		var t;
		if (t = e[Mt]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[Pt] || n[Mt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[Mt]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Ut(e) {
		if (e = e[Mt] || e[Pt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function Wt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Gt(e) {
		var t = e[Rt];
		return t ||= e[Rt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function Kt(e) {
		e[zt] = !0;
	}
	function qt(e) {
		e[Bt] = void 0;
	}
	var Jt = /* @__PURE__ */ new Set(), Yt = {};
	function Xt(e, t) {
		Zt(e, t), Zt(e + "Capture", t);
	}
	function Zt(e, t) {
		for (Yt[e] = t, e = 0; e < t.length; e++) Jt.add(t[e]);
	}
	var Qt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), $t = {}, en = {};
	function tn(e) {
		return Ge.call(en, e) ? !0 : Ge.call($t, e) ? !1 : Qt.test(e) ? en[e] = !0 : ($t[e] = !0, !1);
	}
	var k = !1;
	function nn() {
		var e = k;
		return k = !1, e;
	}
	function rn(e, t, n) {
		if (tn(t)) {
			if (n === null) e.removeAttribute(t);
			else {
				switch (typeof n) {
					case "undefined":
					case "function":
					case "symbol":
						e.removeAttribute(t);
						return;
					case "boolean":
						var r = t.toLowerCase().slice(0, 5);
						if (r !== "data-" && r !== "aria-") {
							e.removeAttribute(t);
							return;
						}
				}
				e.setAttribute(t, n);
			}
		}
	}
	function an(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, n);
		}
	}
	function on(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, r);
		}
	}
	function sn(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function cn(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function ln(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function un(e) {
		if (!e._valueTracker) {
			var t = cn(e) ? "checked" : "value";
			e._valueTracker = ln(e, t, "" + e[t]);
		}
	}
	function dn(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = cn(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var fn = /[\n"\\]/g;
	function pn(e) {
		return e.replace(fn, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function mn(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + sn(t)) : e.value !== "" + sn(t) && (e.value = "" + sn(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : gn(e, sn(n)) : o === "number" && e.value == t ? gn(e, sn(e.value)) : gn(e, sn(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + sn(s) : e.removeAttribute("name");
	}
	function hn(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				un(e);
				return;
			}
			n = n == null ? "" : "" + sn(n), t = t == null ? n : "" + sn(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), un(e);
	}
	function gn(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function _n(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + sn(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function vn(e, t, n) {
		if (t != null && (t = "" + sn(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + sn(n);
	}
	function yn(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (Te(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = sn(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), un(e);
	}
	function bn(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var xn = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function Sn(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || xn.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function Cn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", k = !0);
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && (Sn(e, a, r), k = !0);
		} else for (var o in t) t.hasOwnProperty(o) && Sn(e, o, t[o]);
	}
	function wn(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Tn = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["maskType", "mask-type"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), En = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function Dn(e) {
		return En.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function On() {}
	var kn = null;
	function An(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var jn = null, Mn = null;
	function Nn(e) {
		var t = Ut(e);
		if (t && (e = t.stateNode)) {
			var n = e[Nt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (mn(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + pn("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[Nt] || null;
								if (!a) throw Error(i(90));
								mn(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && dn(r);
					}
					break a;
				case "textarea":
					vn(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && _n(e, !!n.multiple, t, !1);
			}
		}
	}
	var Pn = !1;
	function Fn(e, t, n) {
		if (Pn) return e(t, n);
		Pn = !0;
		try {
			return e(t);
		} finally {
			if (Pn = !1, (jn !== null || Mn !== null) && (zd(), jn && (t = jn, e = Mn, Mn = jn = null, Nn(t), e))) for (t = 0; t < e.length; t++) Nn(e[t]);
		}
	}
	function In(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[Nt] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var Ln = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, Rn = !1;
	if (Ln) try {
		var zn = {};
		Object.defineProperty(zn, "passive", { get: function() {
			Rn = !0;
		} }), window.addEventListener("test", zn, zn), window.removeEventListener("test", zn, zn);
	} catch {
		Rn = !1;
	}
	var Bn = null, Vn = null, Hn = null;
	function Un() {
		if (Hn) return Hn;
		var e, t = Vn, n = t.length, r, i = "value" in Bn ? Bn.value : Bn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return Hn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Wn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Gn() {
		return !0;
	}
	function Kn() {
		return !1;
	}
	function qn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Gn : Kn, this.isPropagationStopped = Kn, this;
		}
		return w(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Gn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Gn);
			},
			persist: function() {},
			isPersistent: Gn
		}), t;
	}
	var Jn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Yn = qn(Jn), Xn = w({}, Jn, {
		view: 0,
		detail: 0
	}), Zn = qn(Xn), Qn, $n, er, tr = w({}, Xn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: dr,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== er && (er && e.type === "mousemove" ? (Qn = e.screenX - er.screenX, $n = e.screenY - er.screenY) : $n = Qn = 0, er = e), Qn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : $n;
		}
	}), nr = qn(tr), A = qn(w({}, tr, { dataTransfer: 0 })), rr = qn(w({}, Xn, { relatedTarget: 0 })), ir = qn(w({}, Jn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), ar = qn(w({}, Jn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), or = qn(w({}, Jn, { data: 0 })), sr = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, cr = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, lr = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function ur(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = lr[e]) ? !!t[e] : !1;
	}
	function dr() {
		return ur;
	}
	var fr = qn(w({}, Xn, {
		key: function(e) {
			if (e.key) {
				var t = sr[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Wn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? cr[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: dr,
		charCode: function(e) {
			return e.type === "keypress" ? Wn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Wn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), pr = qn(w({}, tr, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), mr = qn(w({}, Jn, { submitter: 0 })), hr = qn(w({}, Xn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: dr
	})), gr = qn(w({}, Jn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), _r = qn(w({}, tr, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), vr = qn(w({}, Jn, {
		newState: 0,
		oldState: 0,
		source: 0
	})), yr = [
		9,
		13,
		27,
		32
	], br = Ln && "CompositionEvent" in window, xr = null;
	Ln && "documentMode" in document && (xr = document.documentMode);
	var Sr = Ln && "TextEvent" in window && !xr, Cr = Ln && (!br || xr && 8 < xr && 11 >= xr), wr = " ", Tr = !1;
	function Er(e, t) {
		switch (e) {
			case "keyup": return yr.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function Dr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var Or = !1;
	function kr(e, t) {
		switch (e) {
			case "compositionend": return Dr(t);
			case "keypress": return t.which === 32 ? (Tr = !0, wr) : null;
			case "textInput": return e = t.data, e === wr && Tr ? null : e;
			default: return null;
		}
	}
	function Ar(e, t) {
		if (Or) return e === "compositionend" || !br && Er(e, t) ? (e = Un(), Hn = Vn = Bn = null, Or = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Cr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var jr = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function Mr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!jr[e.type] : t === "textarea";
	}
	function Nr(e, t, n, r) {
		jn ? Mn ? Mn.push(r) : Mn = [r] : jn = r, t = Jf(t, "onChange"), 0 < t.length && (n = new Yn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var Pr = null, Fr = null;
	function j(e) {
		Vf(e, 0);
	}
	function Ir(e) {
		if (dn(Wt(e))) return e;
	}
	function Lr(e, t) {
		if (e === "change") return t;
	}
	var Rr = !1;
	if (Ln) {
		var zr;
		if (Ln) {
			var Br = "oninput" in document;
			if (!Br) {
				var Vr = document.createElement("div");
				Vr.setAttribute("oninput", "return;"), Br = typeof Vr.oninput == "function";
			}
			zr = Br;
		} else zr = !1;
		Rr = zr && (!document.documentMode || 9 < document.documentMode);
	}
	function Hr() {
		Pr && (Pr.detachEvent("onpropertychange", M), Fr = Pr = null);
	}
	function M(e) {
		if (e.propertyName === "value" && Ir(Fr)) {
			var t = [];
			Nr(t, Fr, e, An(e)), Fn(j, t);
		}
	}
	function Ur(e, t, n) {
		e === "focusin" ? (Hr(), Pr = t, Fr = n, Pr.attachEvent("onpropertychange", M)) : e === "focusout" && Hr();
	}
	function Wr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return Ir(Fr);
	}
	function Gr(e, t) {
		if (e === "click") return Ir(t);
	}
	function Kr(e, t) {
		if (e === "input" || e === "change") return Ir(t);
	}
	function qr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Jr = typeof Object.is == "function" ? Object.is : qr;
	function Yr(e, t) {
		if (Jr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!Ge.call(t, i) || !Jr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Xr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function Zr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Qr(e, t) {
		var n = Zr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Zr(n);
		}
	}
	function $r(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? $r(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function ei(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Xr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Xr(e.document);
		}
		return t;
	}
	function ti(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var ni = Ln && "documentMode" in document && 11 >= document.documentMode, ri = null, ii = null, ai = null, oi = !1;
	function si(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		oi || ri == null || ri !== Xr(r) || (r = ri, "selectionStart" in r && ti(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), ai && Yr(ai, r) || (ai = r, r = Jf(ii, "onSelect"), 0 < r.length && (t = new Yn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = ri)));
	}
	function ci(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var li = {
		animationend: ci("Animation", "AnimationEnd"),
		animationiteration: ci("Animation", "AnimationIteration"),
		animationstart: ci("Animation", "AnimationStart"),
		transitionrun: ci("Transition", "TransitionRun"),
		transitionstart: ci("Transition", "TransitionStart"),
		transitioncancel: ci("Transition", "TransitionCancel"),
		transitionend: ci("Transition", "TransitionEnd")
	}, ui = {}, di = {};
	Ln && (di = document.createElement("div").style, "AnimationEvent" in window || (delete li.animationend.animation, delete li.animationiteration.animation, delete li.animationstart.animation), "TransitionEvent" in window || delete li.transitionend.transition);
	function fi(e) {
		if (ui[e]) return ui[e];
		if (!li[e]) return e;
		var t = li[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in di) return ui[e] = t[n];
		return e;
	}
	var pi = fi("animationend"), mi = fi("animationiteration"), hi = fi("animationstart"), gi = fi("transitionrun"), _i = fi("transitionstart"), vi = fi("transitioncancel"), yi = fi("transitionend"), bi = /* @__PURE__ */ new Map(), xi = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	xi.push("scrollEnd");
	function Si(e, t) {
		bi.set(e, t), Xt(t, [e]);
	}
	var Ci = 0;
	function wi(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = bd.identifierPrefix;
		var n = Ci++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function Ti(e) {
		if (e == null || typeof e == "string") return e;
		var t = null, n = Od;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = e[n[r]];
			if (i != null) {
				if (i === "none") return "none";
				t = t == null ? i : t + (" " + i);
			}
		}
		return t ?? e.default;
	}
	function Ei(e, t) {
		return e = Ti(e), t = Ti(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var Di = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, Oi = [], ki = 0, Ai = 0;
	function ji() {
		for (var e = ki, t = Ai = ki = 0; t < e;) {
			var n = Oi[t];
			Oi[t++] = null;
			var r = Oi[t];
			Oi[t++] = null;
			var i = Oi[t];
			Oi[t++] = null;
			var a = Oi[t];
			if (Oi[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && Fi(n, i, a);
		}
	}
	function Mi(e, t, n, r) {
		Oi[ki++] = e, Oi[ki++] = t, Oi[ki++] = n, Oi[ki++] = r, Ai |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function Ni(e, t, n, r) {
		return Mi(e, t, n, r), Ii(e);
	}
	function Pi(e, t) {
		return Mi(e, null, null, t), Ii(e);
	}
	function Fi(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - ct(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function Ii(e) {
		if (50 < kd) throw kd = 0, Ad = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var Li = {};
	function Ri(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function zi(e, t, n, r) {
		return new Ri(e, t, n, r);
	}
	function Bi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Vi(e, t) {
		var n = e.alternate;
		return n === null ? (n = zi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function Hi(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function Ui(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof r == "function") Bi(r) && (s = 1);
		else if (typeof r == "string") s = qm(e, n, Ae.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case ge: return e = zi(31, n, t, a), e.elementType = ge, e.lanes = o, e;
			case oe: return Wi(n.children, a, o, t);
			case se:
				s = 8, a |= 24;
				break;
			case ce: return e = zi(12, n, t, a | 2), e.elementType = ce, e.lanes = o, e;
			case fe: return e = zi(13, n, t, a), e.elementType = fe, e.lanes = o, e;
			case pe: return e = zi(19, n, t, a), e.elementType = pe, e.lanes = o, e;
			case _e:
			case ye: return e = a | 32, e = zi(30, n, t, e), e.elementType = ye, e.lanes = o, e.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, e;
			default:
				if (typeof r == "object" && r) switch (r.$$typeof) {
					case ue:
						s = 10;
						break a;
					case le:
						s = 9;
						break a;
					case de:
						s = 11;
						break a;
					case me:
						s = 14;
						break a;
					case he:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = zi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function Wi(e, t, n, r) {
		return e = zi(7, e, r, t), e.lanes = n, e;
	}
	function Gi(e, t, n) {
		return e = zi(6, e, null, t), e.lanes = n, e;
	}
	function Ki(e) {
		var t = zi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function qi(e, t, n) {
		return t = zi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Ji = /* @__PURE__ */ new WeakMap();
	function Yi(e, t) {
		if (typeof e == "object" && e) {
			var n = Ji.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: We(t)
			}, Ji.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: We(t)
		};
	}
	var Xi = [], Zi = 0, Qi = null, $i = 0, N = [], ea = 0, ta = null, na = 1, ra = "";
	function ia(e, t) {
		Xi[Zi++] = $i, Xi[Zi++] = Qi, Qi = e, $i = t;
	}
	function aa(e, t, n) {
		N[ea++] = na, N[ea++] = ra, N[ea++] = ta, ta = e;
		var r = na;
		e = ra;
		var i = 32 - ct(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - ct(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, na = 1 << 32 - ct(t) + i | n << i | r, ra = a + e;
		} else na = 1 << a | n << i | r, ra = e;
	}
	function oa(e) {
		e.return !== null && (ia(e, 1), aa(e, 1, 0));
	}
	function sa(e) {
		for (; e === Qi;) Qi = Xi[--Zi], Xi[Zi] = null, $i = Xi[--Zi], Xi[Zi] = null;
		for (; e === ta;) ta = N[--ea], N[ea] = null, ra = N[--ea], N[ea] = null, na = N[--ea], N[ea] = null;
	}
	function ca(e, t) {
		N[ea++] = na, N[ea++] = ra, N[ea++] = ta, na = t.id, ra = t.overflow, ta = e;
	}
	var la = null, P = null, F = !1, ua = null, da = !1, fa = Error(i(519));
	function pa(e) {
		throw va(Yi(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), fa;
	}
	function ma(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[Mt] = e, t[Nt] = r, n) {
			case "dialog":
				Q("cancel", t), Q("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				Q("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < zf.length; n++) Q(zf[n], t);
				break;
			case "source":
				Q("error", t);
				break;
			case "img":
			case "image":
			case "link":
				Q("error", t), Q("load", t);
				break;
			case "details":
				Q("toggle", t);
				break;
			case "input":
				Q("invalid", t), hn(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), yn(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || ep(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = On), t = !0) : t = !1, t || pa(e, !0);
	}
	function ha(e) {
		for (la = e.return; la;) switch (la.tag) {
			case 5:
			case 31:
			case 13:
				da = !1;
				return;
			case 27:
			case 3:
				da = !0;
				return;
			default: la = la.return;
		}
	}
	function ga(e) {
		if (e !== la) return !1;
		if (!F) return ha(e), F = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && P && pa(e), ha(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			P = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			P = dm(e);
		} else t === 27 ? (t = P, Sp(e.type) ? (e = um, um = null, P = e) : P = t) : P = la ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function I() {
		P = la = null, F = !1;
	}
	function _a() {
		var e = ua;
		return e !== null && (fd === null ? fd = e : fd.push.apply(fd, e), ua = null), e;
	}
	function va(e) {
		ua === null ? ua = [e] : ua.push(e);
	}
	var ya = ke(null), ba = null, L = null;
	function xa(e, t, n) {
		O(ya, t._currentValue), t._currentValue = n;
	}
	function Sa(e) {
		e._currentValue = ya.current, D(ya);
	}
	function Ca(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function wa(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Ca(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Ca(s, n, e), s = null;
			} else a.tag === 13 && a.memoizedState !== null && a.memoizedState.dehydrated === null ? (a.lanes |= n, s = a.alternate, s !== null && (s.lanes |= n), Ca(a.return, n, e), s = a.child, s = s === null ? null : s.sibling) : s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Ta(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					Jr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === Ne.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			a = a.return;
		}
		return e !== null && wa(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function Ea(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Jr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function Da(e) {
		ba = e, L = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function Oa(e) {
		return Aa(ba, e);
	}
	function ka(e, t) {
		return ba === null && Da(e), Aa(e, t);
	}
	function Aa(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, L === null) {
			if (e === null) throw Error(i(308));
			L = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else L = L.next = t;
		return n;
	}
	var ja = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, Ma = t.unstable_scheduleCallback, Na = t.unstable_NormalPriority, Pa = {
		$$typeof: ue,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function Fa() {
		return {
			controller: new ja(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function Ia(e) {
		e.refCount--, e.refCount === 0 && Ma(Na, function() {
			e.controller.abort();
		});
	}
	function La(e, t) {
		if (e.pendingLanes & 4194048) {
			var n = e.transitionTypes;
			for (n === null && (n = e.transitionTypes = []), e = 0; e < t.length; e++) {
				var r = t[e];
				n.indexOf(r) === -1 && n.push(r);
			}
		}
	}
	var Ra = null;
	function za(e) {
		var t = e.transitionTypes;
		return e.transitionTypes = null, t;
	}
	var Ba = null, Va = 0, Ha = 0, Ua = null;
	function Wa(e, t) {
		if (Ba === null) {
			var n = Ba = [];
			Va = 0, Ha = Pf(), Ua = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return Va++, t.then(Ga, Ga), t;
	}
	function Ga() {
		if (--Va === 0 && (Ra = null, Ba !== null)) {
			Ua !== null && (Ua.status = "fulfilled");
			var e = Ba;
			Ba = null, Ha = 0, Ua = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function Ka(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var qa = T.S;
	T.S = function(e, t) {
		if (hd = Xe(), typeof t == "object" && t && typeof t.then == "function" && Wa(e, t), Ra !== null) for (var n = bf; n !== null;) La(n, Ra), n = n.next;
		if (n = e.types, n !== null) {
			for (var r = bf; r !== null;) La(r, n), r = r.next;
			if (Ha !== 0) {
				r = Ra, r === null && (r = Ra = []);
				for (var i = 0; i < n.length; i++) {
					var a = n[i];
					r.indexOf(a) === -1 && r.push(a);
				}
			}
		}
		qa !== null && qa(e, t);
	};
	var Ja = ke(null);
	function Ya() {
		var e = Ja.current;
		return e === null ? G.pooledCache : e;
	}
	function Xa(e, t) {
		t === null ? O(Ja, Ja.current) : O(Ja, t.pool);
	}
	function Za() {
		var e = Ya();
		return e === null ? null : {
			parent: Pa._currentValue,
			pool: e
		};
	}
	var Qa = Error(i(460)), $a = Error(i(474)), eo = Error(i(542)), to = { then: function() {} };
	function no(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function ro(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(On, On), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, so(e), e === void 0 && !("reason" in t) ? Error(i(600)) : e;
			default:
				if (typeof t.status == "string") t.then(On, On);
				else {
					if (e = G, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, so(e), e;
				}
				throw ao = t, Qa;
		}
	}
	function io(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (ao = e, Qa) : e;
		}
	}
	var ao = null;
	function oo() {
		if (ao === null) throw Error(i(459));
		var e = ao;
		return ao = null, e;
	}
	function so(e) {
		if (e === Qa || e === eo) throw Error(i(483));
	}
	var co = null, lo = 0;
	function uo(e) {
		var t = lo;
		return lo += 1, co === null && (co = []), ro(co, e, t);
	}
	function fo(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function po(e, t) {
		throw t.$$typeof === re ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function mo(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = Vi(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Gi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === oe ? (e = d(e, t, n.props.children, r, n.key), fo(e, n), e) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === he && io(i) === t.type) ? (t = a(t, n.props), fo(t, n), t.return = e, t) : (t = Ui(n.type, n.key, n.props, null, e.mode, r), fo(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = qi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = Wi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Gi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case ie: return n = Ui(t.type, t.key, t.props, null, e.mode, n), fo(n, t), n.return = e, n;
					case ae: return t = qi(t, e.mode, n), t.return = e, t;
					case he: return t = io(t), f(e, t, n);
				}
				if (Te(t) || Se(t)) return t = Wi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, uo(t), n);
				if (t.$$typeof === ue) return f(e, ka(e, t), n);
				po(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case ie: return n.key === i ? l(e, t, n, r) : null;
					case ae: return n.key === i ? u(e, t, n, r) : null;
					case he: return n = io(n), p(e, t, n, r);
				}
				if (Te(n) || Se(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, uo(n), r);
				if (n.$$typeof === ue) return p(e, t, ka(e, n), r);
				po(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case ie: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case ae: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case he: return r = io(r), m(e, t, n, r, i);
				}
				if (Te(r) || Se(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, uo(r), i);
				if (r.$$typeof === ue) return m(e, t, n, ka(t, r), i);
				po(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), F && ia(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return F && ia(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), F && ia(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), F && ia(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return F && ia(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), F && ia(a, g), u;
		}
		function _(e, r, o, c) {
			if (typeof o == "object" && o && o.type === oe && o.key === null && o.props.ref === void 0 && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case ie:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === oe) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), fo(c, o), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === he && io(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), fo(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === oe ? (c = Wi(o.props.children, e.mode, c, o.key), fo(c, o), c.return = e, e = c) : (c = Ui(o.type, o.key, o.props, null, e.mode, c), fo(c, o), c.return = e, e = c);
						}
						return s(e);
					case ae:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
										n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = qi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case he: return o = io(o), _(e, r, o, c);
				}
				if (Te(o)) return h(e, r, o, c);
				if (Se(o)) {
					if (l = Se(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return _(e, r, uo(o), c);
				if (o.$$typeof === ue) return _(e, r, ka(e, o), c);
				po(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = Gi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				lo = 0;
				var i = _(e, t, n, r);
				return co = null, i;
			} catch (t) {
				if (t === Qa || t === eo) throw t;
				var a = zi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var ho = mo(!0), go = mo(!1), _o = !1;
	function vo(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function yo(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function bo(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function xo(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, W & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = Ii(e), Fi(e, null, n), t;
		}
		return Mi(e, r, t, n), Ii(e);
	}
	function So(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Tt(e, n);
		}
	}
	function Co(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var wo = !1;
	function To() {
		if (wo) {
			var e = Ua;
			if (e !== null) throw e;
		}
	}
	function Eo(e, t, n, r) {
		wo = !1;
		var i = e.updateQueue;
		_o = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (q & f) === f : (r & f) === f) {
					f !== 0 && f === Ha && (wo = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, h = s;
						f = t;
						var g = n;
						switch (h.tag) {
							case 1:
								if (m = h.payload, typeof m == "function") {
									d = m.call(g, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = h.payload, f = typeof m == "function" ? m.call(g, d, f) : m, f == null) break a;
								d = w({}, d, f);
								break a;
							case 2: _o = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), sd |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Do(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Oo(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Do(n[e], t);
	}
	var ko = ke(null), Ao = ke(0);
	function jo(e, t) {
		e = od, O(Ao, e), O(ko, t), od = e | t.baseLanes;
	}
	function Mo() {
		O(Ao, od), O(ko, ko.current);
	}
	function No() {
		od = Ao.current, D(ko), D(Ao);
	}
	var Po = ke(null), Fo = null;
	function Io(e) {
		var t = e.alternate;
		O(Vo, Vo.current & 1), O(Po, e), Fo === null && (t === null || ko.current !== null || t.memoizedState !== null) && (Fo = e);
	}
	function Lo(e) {
		O(Vo, Vo.current), O(Po, e), Fo === null && (Fo = e);
	}
	function Ro(e) {
		e.tag === 22 ? (O(Vo, Vo.current), O(Po, e), Fo === null && (Fo = e)) : zo();
	}
	function zo() {
		O(Vo, Vo.current), O(Po, Po.current);
	}
	function Bo(e) {
		D(Po), Fo === e && (Fo = null), D(Vo);
	}
	var Vo = ke(0);
	function Ho(e, t) {
		O(Po, Po.current), O(Vo, t);
	}
	function Uo(e) {
		D(Vo), D(Po), Fo === e && (Fo = null);
	}
	function Wo(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || om(n) || sm(n))) return t;
			} else if (t.tag === 19 && t.memoizedProps.revealOrder !== "independent") {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var Go = 0, R = null, z = null, Ko = null, qo = !1, Jo = !1, Yo = !1, Xo = 0, Zo = 0, Qo = null, $o = 0;
	function es() {
		throw Error(i(321));
	}
	function ts(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Jr(e[n], t[n])) return !1;
		return !0;
	}
	function ns(e, t, n, r, i, a) {
		return Go = a, R = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, T.H = e === null || e.memoizedState === null ? yc : bc, Yo = !1, a = n(r, i), Yo = !1, Jo && (a = is(t, n, r, i)), rs(e), a;
	}
	function rs(e) {
		T.H = vc;
		var t = z !== null && z.next !== null;
		if (Go = 0, Ko = z = R = null, qo = !1, Zo = 0, Qo = null, t) throw Error(i(300));
		e === null || Lc || (e = e.dependencies, e !== null && Ea(e) && (Lc = !0));
	}
	function is(e, t, n, r) {
		R = e;
		var a = 0;
		do {
			if (Jo && (Qo = null), Zo = 0, Jo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, Ko = z = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			T.H = xc, o = t(n, r);
		} while (Jo);
		return o;
	}
	function as() {
		var e = T.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? fs(t) : t, e = e.useState()[0], (z === null ? null : z.memoizedState) !== e && (R.flags |= 1024), t;
	}
	function os() {
		var e = Xo !== 0;
		return Xo = 0, e;
	}
	function ss(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function cs(e) {
		if (qo) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			qo = !1;
		}
		Go = 0, Ko = z = R = null, Jo = !1, Zo = Xo = 0, Qo = null;
	}
	function ls() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return Ko === null ? R.memoizedState = Ko = e : Ko = Ko.next = e, Ko;
	}
	function us() {
		if (z === null) {
			var e = R.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = z.next;
		var t = Ko === null ? R.memoizedState : Ko.next;
		if (t !== null) Ko = t, z = e;
		else {
			if (e === null) throw R.alternate === null ? Error(i(467)) : Error(i(310));
			z = e, e = {
				memoizedState: z.memoizedState,
				baseState: z.baseState,
				baseQueue: z.baseQueue,
				queue: z.queue,
				next: null
			}, Ko === null ? R.memoizedState = Ko = e : Ko = Ko.next = e;
		}
		return Ko;
	}
	function ds() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function fs(e) {
		var t = Zo;
		return Zo += 1, Qo === null && (Qo = []), e = ro(Qo, e, t), t = R, (Ko === null ? t.memoizedState : Ko.next) === null && (t = t.alternate, T.H = t === null || t.memoizedState === null ? yc : bc), e;
	}
	function ps(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return fs(e);
			if (e.$$typeof === be) return;
			if (e.$$typeof === ue) return Oa(e);
		}
		throw Error(i(438, String(e)));
	}
	function ms(e) {
		var t = null, n = R.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = R.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = ds(), R.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ve;
		return t.index++, n;
	}
	function hs(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function gs(e) {
		return _s(us(), z, e);
	}
	function _s(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (Go & f) === f : (q & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === Ha && (d = !0);
					else if ((Go & p) === p) {
						u = u.next, p === Ha && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, R.lanes |= p, sd |= p;
					f = u.action, Yo && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, R.lanes |= f, sd |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !Jr(o, e.memoizedState) && (Lc = !0, d && (n = Ua, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function vs(e) {
		var t = us(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			Jr(o, t.memoizedState) || (Lc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function ys(e, t, n) {
		var r = R, a = us(), o = F;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !Jr((z || a).memoizedState, n);
		if (s && (a.memoizedState = n, Lc = !0), a = a.queue, Ws(Ss.bind(null, r, a, e), [e]), e = a.getSnapshot !== t || s || Ko !== null && !!(Ko.memoizedState.tag & 1), zs(e ? 9 : 8, { destroy: void 0 }, xs.bind(null, r, a, n, t), null), e) {
			if (r.flags |= 2048, G === null) throw Error(i(349));
			o || Go & 127 || bs(r, t, n);
		}
		return n;
	}
	function bs(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = R.updateQueue, t === null ? (t = ds(), R.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function xs(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Cs(t) && ws(e);
	}
	function Ss(e, t, n) {
		return n(function() {
			Cs(t) && ws(e);
		});
	}
	function Cs(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Jr(e, n);
		} catch {
			return !0;
		}
	}
	function ws(e) {
		var t = Pi(e, 2);
		t !== null && Pd(t, e, 2);
	}
	function Ts(e) {
		var t = ls();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Yo) {
				st(!0);
				try {
					n();
				} finally {
					st(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: hs,
			lastRenderedState: e
		}, t;
	}
	function Es(e, t, n, r) {
		return e.baseState = n, _s(e, z, typeof r == "function" ? r : hs);
	}
	function Ds(e, t, n, r, a) {
		if (hc(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			T.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Os(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Os(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = T.T, o = {};
			o.types = a === null ? null : a.types, T.T = o;
			try {
				var s = n(i, r), c = T.S;
				c !== null && c(o, s), ks(e, t, s);
			} catch (n) {
				js(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), T.T = a;
			}
		} else try {
			a = n(i, r), ks(e, t, a);
		} catch (n) {
			js(e, t, n);
		}
	}
	function ks(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			As(e, t, n);
		}, function(n) {
			return js(e, t, n);
		}) : As(e, t, n);
	}
	function As(e, t, n) {
		t.status = "fulfilled", t.value = n, Ms(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Os(e, n)));
	}
	function js(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Ms(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Ms(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function Ns(e, t) {
		return t;
	}
	function Ps(e, t) {
		if (F) {
			var n = G.formState;
			if (n !== null) {
				a: {
					var r = R;
					if (F) {
						if (P) {
							b: {
								for (var i = P, a = da; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = lm(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								P = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						pa(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = ls(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Ns,
			lastRenderedState: t
		}, n.queue = r, n = fc.bind(null, R, r), r.dispatch = n, r = Ts(!1), a = mc.bind(null, R, !1, r.queue), r = ls(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Ds.bind(null, R, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Fs(e) {
		return Is(us(), z, e);
	}
	function Is(e, t, n) {
		if (t = _s(e, t, Ns)[0], e = gs(hs)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = fs(t);
		} catch (e) {
			throw e === Qa ? eo : e;
		}
		else r = t;
		t = us();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (R.flags |= 2048, zs(9, { destroy: void 0 }, Ls.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Ls(e, t) {
		e.action = t;
	}
	function Rs(e) {
		var t = us(), n = z;
		if (n !== null) return Is(t, n, e);
		us(), t = t.memoizedState, n = us();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function zs(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = R.updateQueue, t === null && (t = ds(), R.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function Bs() {
		return us().memoizedState;
	}
	function Vs(e, t, n, r) {
		var i = ls();
		R.flags |= e, i.memoizedState = zs(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function Hs(e, t, n, r) {
		var i = us();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		z !== null && r !== null && ts(r, z.memoizedState.deps) ? i.memoizedState = zs(t, a, n, r) : (R.flags |= e, i.memoizedState = zs(1 | t, a, n, r));
	}
	function Us(e, t) {
		Vs(8390656, 8, e, t);
	}
	function Ws(e, t) {
		Hs(2048, 8, e, t);
	}
	function Gs(e) {
		R.flags |= 4;
		var t = R.updateQueue;
		if (t === null) t = ds(), R.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function Ks(e) {
		var t = us().memoizedState;
		return Gs({
			ref: t,
			nextImpl: e
		}), function() {
			if (W & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function qs(e, t) {
		return Hs(4, 2, e, t);
	}
	function Js(e, t) {
		return Hs(4, 4, e, t);
	}
	function Ys(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function Xs(e, t, n) {
		n = n == null ? null : n.concat([e]), Hs(4, 4, Ys.bind(null, t, e), n);
	}
	function Zs() {}
	function Qs(e, t) {
		var n = us();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && ts(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function $s(e, t) {
		var n = us();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && ts(t, r[1])) return r[0];
		if (r = e(), Yo) {
			st(!0);
			try {
				e();
			} finally {
				st(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function ec(e, t, n) {
		return n === void 0 || Go & 1073741824 && !(q & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = Md(), R.lanes |= e, sd |= e, n);
	}
	function tc(e, t, n, r) {
		return Jr(n, t) ? n : ko.current === null ? !(Go & 106) || Go & 1073741824 && !(q & 261930) ? (Lc = !0, e.memoizedState = n) : (e = Md(), R.lanes |= e, sd |= e, t) : (e = ec(e, n, r), Jr(e, t) || (Lc = !0), e);
	}
	function nc(e, t, n, r, i) {
		var a = E.p;
		E.p = a !== 0 && 8 > a ? a : 8;
		var o = T.T, s = {};
		s.types = o === null ? null : o.types, T.T = s, mc(e, !1, t, n);
		try {
			var c = i(), l = T.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? pc(e, t, Ka(c, r), jd(e)) : pc(e, t, r, jd(e));
		} catch (n) {
			pc(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, jd());
		} finally {
			E.p = a, o !== null && s.types !== null && (o.types = s.types), T.T = o;
		}
	}
	function rc() {}
	function ic(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = ac(e).queue;
		nc(e, a, t, Ee, n === null ? rc : function() {
			return oc(e), n(r);
		});
	}
	function ac(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: Ee,
			baseState: Ee,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: hs,
				lastRenderedState: Ee
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: hs,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function oc(e) {
		var t = ac(e);
		t.next === null && (t = e.alternate.memoizedState), pc(e, t.next.queue, {}, jd());
	}
	function sc() {
		return Oa(sh);
	}
	function cc() {
		return us().memoizedState;
	}
	function lc() {
		return us().memoizedState;
	}
	function uc(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = jd();
					e = bo(n);
					var r = xo(t, e, n);
					r !== null && (Pd(r, t, n), So(r, t, n)), t = { cache: Fa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function dc(e, t, n) {
		var r = jd();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, hc(e) ? gc(t, n) : (n = Ni(e, t, n, r), n !== null && (Pd(n, e, r), _c(n, t, r)));
	}
	function fc(e, t, n) {
		pc(e, t, n, jd());
	}
	function pc(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (hc(e)) gc(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Jr(s, o)) return Mi(e, t, i, 0), G === null && ji(), !1;
			} catch {}
			if (n = Ni(e, t, i, r), n !== null) return Pd(n, e, r), _c(n, t, r), !0;
		}
		return !1;
	}
	function mc(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: Pf(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, hc(e)) {
			if (t) throw Error(i(479));
		} else t = Ni(e, n, r, 2), t !== null && Pd(t, e, 2);
	}
	function hc(e) {
		var t = e.alternate;
		return e === R || t !== null && t === R;
	}
	function gc(e, t) {
		Jo = qo = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function _c(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Tt(e, n);
		}
	}
	var vc = {
		readContext: Oa,
		use: ps,
		useCallback: es,
		useContext: es,
		useEffect: es,
		useImperativeHandle: es,
		useLayoutEffect: es,
		useInsertionEffect: es,
		useMemo: es,
		useReducer: es,
		useRef: es,
		useState: es,
		useDebugValue: es,
		useDeferredValue: es,
		useTransition: es,
		useSyncExternalStore: es,
		useId: es,
		useHostTransitionStatus: es,
		useFormState: es,
		useActionState: es,
		useOptimistic: es,
		useMemoCache: es,
		useCacheRefresh: es,
		useEffectEvent: es
	}, yc = {
		readContext: Oa,
		use: ps,
		useCallback: function(e, t) {
			return ls().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: Oa,
		useEffect: Us,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), Vs(4194308, 4, Ys.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return Vs(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			Vs(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = ls();
			t = t === void 0 ? null : t;
			var r = e();
			if (Yo) {
				st(!0);
				try {
					e();
				} finally {
					st(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = ls();
			if (n !== void 0) {
				var i = n(t);
				if (Yo) {
					st(!0);
					try {
						n(t);
					} finally {
						st(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = dc.bind(null, R, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = ls();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Ts(e);
			var t = e.queue, n = fc.bind(null, R, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Zs,
		useDeferredValue: function(e, t) {
			return ec(ls(), e, t);
		},
		useTransition: function() {
			var e = Ts(!1);
			return e = nc.bind(null, R, e.queue, !0, !1), ls().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = R, a = ls();
			if (F) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), G === null) throw Error(i(349));
				q & 127 || bs(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, Us(Ss.bind(null, r, o, e), [e]), r.flags |= 2048, zs(9, { destroy: void 0 }, xs.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = ls(), t = G.identifierPrefix;
			if (F) {
				var n = ra, r = na;
				n = (r & ~(1 << 32 - ct(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = Xo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = $o++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: sc,
		useFormState: Ps,
		useActionState: Ps,
		useOptimistic: function(e) {
			var t = ls();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = mc.bind(null, R, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: ms,
		useCacheRefresh: function() {
			return ls().memoizedState = uc.bind(null, R);
		},
		useEffectEvent: function(e) {
			var t = ls(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (W & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, bc = {
		readContext: Oa,
		use: ps,
		useCallback: Qs,
		useContext: Oa,
		useEffect: Ws,
		useImperativeHandle: Xs,
		useInsertionEffect: qs,
		useLayoutEffect: Js,
		useMemo: $s,
		useReducer: gs,
		useRef: Bs,
		useState: function() {
			return gs(hs);
		},
		useDebugValue: Zs,
		useDeferredValue: function(e, t) {
			return tc(us(), z.memoizedState, e, t);
		},
		useTransition: function() {
			var e = gs(hs)[0], t = us().memoizedState;
			return [typeof e == "boolean" ? e : fs(e), t];
		},
		useSyncExternalStore: ys,
		useId: cc,
		useHostTransitionStatus: sc,
		useFormState: Fs,
		useActionState: Fs,
		useOptimistic: function(e, t) {
			return Es(us(), z, e, t);
		},
		useMemoCache: ms,
		useCacheRefresh: lc,
		useEffectEvent: Ks
	}, xc = {
		readContext: Oa,
		use: ps,
		useCallback: Qs,
		useContext: Oa,
		useEffect: Ws,
		useImperativeHandle: Xs,
		useInsertionEffect: qs,
		useLayoutEffect: Js,
		useMemo: $s,
		useReducer: vs,
		useRef: Bs,
		useState: function() {
			return vs(hs);
		},
		useDebugValue: Zs,
		useDeferredValue: function(e, t) {
			var n = us();
			return z === null ? ec(n, e, t) : tc(n, z.memoizedState, e, t);
		},
		useTransition: function() {
			var e = vs(hs)[0], t = us().memoizedState;
			return [typeof e == "boolean" ? e : fs(e), t];
		},
		useSyncExternalStore: ys,
		useId: cc,
		useHostTransitionStatus: sc,
		useFormState: Rs,
		useActionState: Rs,
		useOptimistic: function(e, t) {
			var n = us();
			return z === null ? (n.baseState = e, [e, n.queue.dispatch]) : Es(n, z, e, t);
		},
		useMemoCache: ms,
		useCacheRefresh: lc,
		useEffectEvent: Ks
	};
	function Sc(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : w({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Cc = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = jd(), i = bo(r);
			i.payload = t, n != null && (i.callback = n), t = xo(e, i, r), t !== null && (Pd(t, e, r), So(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = jd(), i = bo(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = xo(e, i, r), t !== null && (Pd(t, e, r), So(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = jd(), r = bo(n);
			r.tag = 2, t != null && (r.callback = t), t = xo(e, r, n), t !== null && (Pd(t, e, n), So(t, e, n));
		}
	};
	function wc(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Yr(n, r) || !Yr(i, a) : !0;
	}
	function Tc(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Cc.enqueueReplaceState(t, t.state, null);
	}
	function Ec(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = w({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Dc(e) {
		Di(e);
	}
	function Oc(e) {
		console.error(e);
	}
	function kc(e) {
		Di(e);
	}
	function Ac(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function jc(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Mc(e, t, n) {
		return n = bo(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Ac(e, t);
		}, n;
	}
	function Nc(e) {
		return e = bo(e), e.tag = 3, e;
	}
	function Pc(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				jc(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			jc(t, n, r), typeof i != "function" && (vd === null ? vd = /* @__PURE__ */ new Set([this]) : vd.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function Fc(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Ta(t, n, a, !0), n = Po.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13:
					case 19: return Fo === null ? Kd() : n.alternate === null && Y === 0 && (Y = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === to ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), mf(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === to ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), mf(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return mf(e, r, a), Kd(), !1;
		}
		if (F) return t = Po.current, t === null ? (r !== fa && (t = Error(i(423), { cause: r }), va(Yi(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = Yi(r, n), a = Mc(e.stateNode, r, a), Co(e, a), Y !== 4 && (Y = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== fa && (e = Error(i(422), { cause: r }), va(Yi(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = Yi(o, n), X === null ? X = [o] : X.push(o), Y !== 4 && (Y = 2), t === null) return !0;
		r = Yi(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Mc(n.stateNode, r, e), Co(n, e), !1;
				case 1:
					if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (vd === null || !vd.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = Nc(a), Pc(a, e, n, r), Co(n, a), !1;
					break;
				case 22: if (n.memoizedState !== null) return n.flags |= 65536, !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Ic = Error(i(461)), Lc = !1;
	function Rc(e, t, n, r) {
		t.child = e === null ? go(t, null, n, r) : ho(t, e.child, n, r);
	}
	function zc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return Da(t), r = ns(e, t, n, o, a, i), s = os(), e !== null && !Lc ? (ss(e, t, i), pl(e, t, i)) : (F && s && oa(t), t.flags |= 1, Rc(e, t, r, i), t.child);
	}
	function Bc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !Bi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, Vc(e, t, a, r, i)) : (e = Ui(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !ml(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Yr : n, n(o, r) && e.ref === t.ref) return pl(e, t, i);
		}
		return t.flags |= 1, e = Vi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Vc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Yr(a, r) && e.ref === t.ref) {
				if (Lc = !1, t.pendingProps = r = a, ml(e, i)) e.flags & 131072 && (Lc = !0);
				else return t.lanes = e.lanes, pl(e, t, i);
			}
		}
		return Yc(e, t, n, r, i);
	}
	function Hc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return Wc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && Xa(t, a === null ? null : a.cachePool), a === null ? Mo() : jo(t, a), Ro(t);
			else return r = t.lanes = 536870912, Wc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && Xa(t, null), Mo(), zo()) : (Xa(t, a.cachePool), jo(t, a), zo(), t.memoizedState = null);
		return Rc(e, t, i, n), t.child;
	}
	function Uc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function Wc(e, t, n, r, i) {
		var a = Ya();
		return a = a === null ? null : {
			parent: Pa._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && Xa(t, null), Mo(), Ro(t), e !== null && Ta(e, t, r, !0), t.childLanes = i, null;
	}
	function Gc(e, t) {
		return t = il({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function Kc(e, t, n) {
		return ho(t, e.child, null, n), e = Gc(t, t.pendingProps), e.flags |= 2, Bo(t), t.memoizedState = null, e;
	}
	function qc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (F) {
				if (r.mode === "hidden") return e = Gc(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, Uc(null, e);
				if (Lo(t), (e = P) ? (e = am(e, da), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: ta === null ? null : {
						id: na,
						overflow: ra
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ki(e), n.return = t, t.child = n, la = t, P = null)) : e = null, e === null) throw pa(t);
				return t.lanes = 536870912, null;
			}
			return Gc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (Lo(t), a) {
				if (t.flags & 256) t.flags &= -257, t = Kc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(i(558));
			} else if (Lc || Ta(e, t, n, !1), a = (n & e.childLanes) !== 0, Lc || a) {
				if (ko.current === null) {
					if (r = G, r !== null && (s = Et(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, Pi(e, s), Pd(r, e, s), Ic;
					Kd();
				}
				t = Kc(e, t, n);
			} else e = o.treeContext, P = lm(s.nextSibling), la = t, F = !0, ua = null, da = !1, e !== null && ca(t, e), t = Gc(t, r), t.flags |= 134221824;
			return t;
		}
		return e = Vi(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function Jc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function Yc(e, t, n, r, i) {
		return Da(t), n = ns(e, t, n, r, void 0, i), r = os(), e !== null && !Lc ? (ss(e, t, i), pl(e, t, i)) : (F && r && oa(t), t.flags |= 1, Rc(e, t, n, i), t.child);
	}
	function Xc(e, t, n, r, i, a) {
		return Da(t), t.updateQueue = null, n = is(t, r, n, i), rs(e), r = os(), e !== null && !Lc ? (ss(e, t, a), pl(e, t, a)) : (F && r && oa(t), t.flags |= 1, Rc(e, t, n, a), t.child);
	}
	function Zc(e, t, n, r, i) {
		if (Da(t), t.stateNode === null) {
			var a = Li, o = n.contextType;
			typeof o == "object" && o && (a = Oa(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Cc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, vo(t), o = n.contextType, a.context = typeof o == "object" && o ? Oa(o) : Li, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Sc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Cc.enqueueReplaceState(a, a.state, null), Eo(t, r, a, i), To(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Ec(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = Li, typeof u == "object" && u && (o = Oa(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Tc(t, a, r, o), _o = !1;
			var f = t.memoizedState;
			a.state = f, Eo(t, r, a, i), To(), l = t.memoizedState, s || f !== l || _o ? (typeof d == "function" && (Sc(t, n, d, r), l = t.memoizedState), (c = _o || wc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, yo(e, t), o = t.memoizedProps, u = Ec(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = Li, typeof l == "object" && l && (c = Oa(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Tc(t, a, r, c), _o = !1, f = t.memoizedState, a.state = f, Eo(t, r, a, i), To();
			var p = t.memoizedState;
			o !== d || f !== p || _o || e !== null && e.dependencies !== null && Ea(e.dependencies) ? (typeof s == "function" && (Sc(t, n, s, r), p = t.memoizedState), (u = _o || wc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Ea(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, Jc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = ho(t, e.child, null, i), t.child = ho(t, null, n, i)) : Rc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = pl(e, t, i), e;
	}
	function Qc(e, t, n, r) {
		return I(), t.flags |= 256, Rc(e, t, n, r), t.child;
	}
	var $c = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function el(e) {
		return {
			baseLanes: e,
			cachePool: Za()
		};
	}
	function tl(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= ud), e;
	}
	function nl(e, t, n) {
		var r = t.pendingProps, i = !1, a = !!(t.flags & 128), o;
		if ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : !!(Vo.current & 2)), o && (i = !0, t.flags &= -129), o = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (F) {
				if (i ? Io(t) : zo(), (e = P) ? (e = am(e, da), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: ta === null ? null : {
						id: na,
						overflow: ra
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ki(e), n.return = t, t.child = n, la = t, P = null)) : e = null, e === null) throw pa(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (zo(), i = t.mode, a = il({
				mode: "hidden",
				children: a
			}, i), r = Wi(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = el(n), r.childLanes = tl(e, o, n), t.memoizedState = $c, Uc(null, r)) : (Io(t), rl(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return ol(e, t, a, o, r, c, s, n);
		}
		return i ? (zo(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = Vi(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = Wi(i, a, n, null), i.flags |= 2) : i = Vi(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, Uc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = el(n) : (a = i.cachePool, a === null ? a = Za() : (s = Pa._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = tl(e, o, n), t.memoizedState = $c, Uc(e.child, r)) : (Io(t), n = e.child, e = n.sibling, n = Vi(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (o = t.deletions, o === null ? (t.deletions = [e], t.flags |= 16) : o.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function rl(e, t) {
		return t = il({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function il(e, t) {
		return e = zi(22, e, null, t), e.lanes = 0, e;
	}
	function al(e, t, n) {
		return ho(t, e.child, null, n), e = rl(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function ol(e, t, n, r, a, o, s, c) {
		if (n) return t.flags & 256 ? (Io(t), t.flags &= -257, al(e, t, c)) : t.memoizedState === null ? (zo(), o = a.fallback, s = t.mode, a = il({
			mode: "visible",
			children: a.children
		}, s), o = Wi(o, s, c, null), o.flags |= 2, a.return = t, o.return = t, a.sibling = o, t.child = a, ho(t, e.child, null, c), a = t.child, a.memoizedState = el(c), a.childLanes = tl(e, r, c), t.memoizedState = $c, Uc(null, a)) : (zo(), t.child = e.child, t.flags |= 128, null);
		if (Io(t), sm(o)) {
			if (r = o.nextSibling && o.nextSibling.dataset, r) var l = r.dgst;
			return r = l, r !== "" && (a = Error(i(419)), a.stack = "", a.digest = r, va({
				value: a,
				source: null,
				stack: null
			})), al(e, t, c);
		}
		if (Lc || Ta(e, t, c, !1), r = (c & e.childLanes) !== 0, Lc || r) {
			if (ko.current !== null) return al(e, t, c);
			if (r = G, r !== null && (a = Et(r, c), a !== 0 && a !== s.retryLane)) throw s.retryLane = a, Pi(e, a), Pd(r, e, a), Ic;
			return om(o) || Kd(), al(e, t, c);
		}
		return om(o) ? (t.flags |= 192, t.child = e.child, null) : (e = s.treeContext, P = lm(o.nextSibling), la = t, F = !0, ua = null, da = !1, e !== null && ca(t, e), t = rl(t, a.children), t.flags |= 134221824, t);
	}
	function sl(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Ca(e.return, t, n);
	}
	function cl(e) {
		for (var t = null; e !== null;) {
			var n = e.alternate;
			n !== null && Wo(n) === null && (t = e), e = e.sibling;
		}
		return t;
	}
	function ll(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function ul(e) {
		var t = e.child;
		for (e.child = null; t !== null;) {
			var n = t.sibling;
			t.sibling = e.child, e.child = t, t = n;
		}
	}
	function dl(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = Vo.current;
		if (t.flags & 128) return Ho(t, o), null;
		var s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Ho(t, o), i === "backwards" && e !== null ? (ul(e), Rc(e, t, r, n), ul(e)) : Rc(e, t, r, n), r = F ? $i : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && sl(e, n, t);
			else if (e.tag === 19) sl(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "backwards":
				n = cl(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null, ul(t)), ll(t, !0, i, null, a, r);
				break;
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && Wo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				ll(t, !0, n, null, a, r);
				break;
			case "together":
				ll(t, !1, null, null, void 0, r);
				break;
			case "independent":
				t.memoizedState = null;
				break;
			default: n = cl(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), ll(t, !1, i, n, a, r);
		}
		return t.child;
	}
	function fl(e, t, n) {
		var r = t.pendingProps;
		return xa(t, t.type, r.value), Rc(e, t, r.children, n), t.child;
	}
	function pl(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), sd |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (Ta(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = Vi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Vi(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function ml(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Ea(e)));
	}
	function hl(e, t, n) {
		switch (t.tag) {
			case 3:
				Pe(t, t.stateNode.containerInfo), xa(t, Pa, e.memoizedState.cache), I();
				break;
			case 27:
			case 5:
				Ie(t);
				break;
			case 4:
				Pe(t, t.stateNode.containerInfo);
				break;
			case 10:
				xa(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, Lo(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) {
					if (r.dehydrated !== null) return Io(t), t.flags |= 128, null;
					r = Ta(e, t, n, !1);
					var i = t.child.childLanes;
					return r || (n & i) !== 0 ? nl(e, t, n) : (Io(t), e = pl(e, t, n), e === null ? null : e.sibling);
				}
				Io(t);
				break;
			case 19:
				if (t.flags & 128) return dl(e, t, n);
				if (i = !!(e.flags & 128), r = (n & t.childLanes) !== 0, r ||= (Ta(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return dl(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Ho(t, Vo.current), r) break;
				return null;
			case 22: return t.lanes = 0, Hc(e, t, n, t.pendingProps);
			case 24: xa(t, Pa, e.memoizedState.cache);
		}
		return pl(e, t, n);
	}
	function gl(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) Lc = !0;
			else {
				if (!ml(e, n) && !(t.flags & 128)) return Lc = !1, hl(e, t, n);
				Lc = !!(e.flags & 131072);
			}
		} else Lc = !1, F && t.flags & 1048576 && aa(t, $i, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = io(t.elementType), t.type = e, typeof e == "function") Bi(e) ? (r = Ec(e, r), t.tag = 1, t = Zc(null, t, e, r, n)) : (t.tag = 0, t = Yc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === de) {
								t.tag = 11, t = zc(null, t, e, r, n);
								break a;
							}
							if (a === me) {
								t.tag = 14, t = Bc(null, t, e, r, n);
								break a;
							}
							if (a === ue) {
								t.tag = 10, t.type = e, t = fl(null, t, n);
								break a;
							}
						}
						throw t = we(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return Yc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Ec(r, t.pendingProps), Zc(e, t, r, a, n);
			case 3:
				a: {
					if (Pe(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, yo(e, t), Eo(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, xa(t, Pa, r), r !== o.cache && wa(t, [Pa], n, !0), To(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = Qc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = Yi(Error(i(424)), t), va(a), t = Qc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (P = lm(e.firstChild), la = t, F = !0, ua = null, da = !0, n = go(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (I(), r === a) {
							t = pl(e, t, n);
							break a;
						}
						Rc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return Jc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : F || (t.stateNode = fp(t.type, t.pendingProps, Me.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return Ie(t), e === null && F && (r = t.stateNode = hm(t.type, t.pendingProps, Me.current), la = t, da = !0, a = P, Sp(t.type) ? (um = a, P = lm(r.firstChild)) : P = a), Rc(e, t, t.pendingProps.children, n), Jc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && F && ((a = r = P) && (r = rm(r, t.type, t.pendingProps, da), r === null ? a = !1 : (t.stateNode = r, la = t, P = lm(r.firstChild), da = !1, a = !0)), a || pa(t)), Ie(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, pp(a, o) ? r = null : s !== null && pp(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = ns(e, t, as, null, null, n), sh._currentValue = a), Jc(e, t), Rc(e, t, r, n), t.child;
			case 6: return e === null && F && ((e = n = P) && (n = im(n, t.pendingProps, da), n === null ? e = !1 : (t.stateNode = n, la = t, P = null, e = !0)), e || pa(t)), null;
			case 13: return nl(e, t, n);
			case 4: return Pe(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = ho(t, null, r, n) : Rc(e, t, r, n), t.child;
			case 11: return zc(e, t, t.type, t.pendingProps, n);
			case 7: return r = t.pendingProps, Jc(e, t), Rc(e, t, r, n), t.child;
			case 8: return Rc(e, t, t.pendingProps.children, n), t.child;
			case 12: return Rc(e, t, t.pendingProps.children, n), t.child;
			case 10: return fl(e, t, n);
			case 9: return a = t.type._context, r = t.pendingProps.children, Da(t), a = Oa(a), r = r(a), t.flags |= 1, Rc(e, t, r, n), t.child;
			case 14: return Bc(e, t, t.type, t.pendingProps, n);
			case 15: return Vc(e, t, t.type, t.pendingProps, n);
			case 19: return dl(e, t, n);
			case 31: return qc(e, t, n);
			case 22: return Hc(e, t, n, t.pendingProps);
			case 24: return Da(t), r = Oa(Pa), e === null ? (a = Ya(), a === null && (a = G, o = Fa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, vo(t), xa(t, Pa, a)) : ((e.lanes & n) !== 0 && (yo(e, t), Eo(t, null, null, n), To()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, xa(t, Pa, r), r !== a.cache && wa(t, [Pa], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), xa(t, Pa, r))), Rc(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : F && oa(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : Jc(e, t), Rc(e, t, r.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function _l(e) {
		e.flags |= 4;
	}
	function vl(e, t, n, r, i) {
		var a;
		if ((a = !!(e.mode & 32)) && (a = n === null ? Jm(t, r) : Jm(t, r) && (r.src !== n.src || r.srcSet !== n.srcSet)), a) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (Ud()) e.flags |= 8192;
				else throw ao = to, $a;
			}
		} else e.flags &= -16777217;
	}
	function yl(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ym(t)) {
			if (Ud()) e.flags |= 8192;
			else throw ao = to, $a;
		}
	}
	function bl(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : bt(), e.lanes |= t, dd |= t);
	}
	function xl(e, t) {
		if (!F) switch (e.tailMode) {
			case "visible": break;
			case "collapsed":
				for (var n = e.tail, r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
				break;
			default:
				for (t = e.tail, n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
		}
	}
	function B(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 1206910976, r |= i.flags & 1206910976, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Sl(e, t, n) {
		var r = t.pendingProps;
		switch (sa(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return B(t), null;
			case 1: return B(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Sa(Pa), Fe(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (ga(t) ? _l(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, _a())), B(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (_l(t), o === null ? (B(t), vl(t, a, null, r, n)) : (B(t), yl(t, o))) : o ? o === e.memoizedState ? (B(t), t.flags &= -16777217) : (_l(t), B(t), yl(t, o)) : (e = e.memoizedProps, e !== r && _l(t), B(t), vl(t, a, e, r, n)), null;
			case 27:
				if (Le(t), n = Me.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return B(t), t.subtreeFlags &= -33554433, null;
					}
					e = Ae.current, ga(t) ? ma(t, e) : (e = hm(a, r, n), t.stateNode = e, _l(t));
				}
				return B(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (Le(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return B(t), t.subtreeFlags &= -33554433, null;
					}
					if (o = Ae.current, ga(t)) ma(t, o);
					else {
						var s = lp(Me.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[Mt] = t, o[Nt] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (np(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && _l(t);
					}
				}
				return B(t), t.subtreeFlags &= -33554433, vl(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = Me.current, ga(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = la, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[Mt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || ep(e.nodeValue, n)), e || pa(t, !0);
					} else e = lp(e).createTextNode(r), e[Mt] = t, t.stateNode = e;
				}
				return B(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = ga(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[Mt] = t;
						} else I(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						B(t), e = !1;
					} else n = _a(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (Bo(t), t) : (Bo(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return B(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = ga(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[Mt] = t;
						} else I(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						B(t), a = !1;
					} else a = _a(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (Bo(t), t) : (Bo(t), null);
				}
				return Bo(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), bl(t, t.updateQueue), B(t), null);
			case 4: return Fe(), e === null && Wf(t.stateNode.containerInfo), t.flags |= 67108864, B(t), null;
			case 10: return Sa(t.type), B(t), null;
			case 19:
				if (Uo(t), r = t.memoizedState, r === null) return B(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) xl(r, !1);
					else {
						if (Y !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = Wo(e), o !== null) {
								for (t.flags |= 128, xl(r, !1), e = o.updateQueue, t.updateQueue = e, bl(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Hi(n, e), n = n.sibling;
								return Ho(t, Vo.current & 1 | 2), F && ia(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && Xe() > gd && (t.flags |= 128, a = !0, xl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = Wo(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, bl(t, e), xl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !o.alternate && !F) return B(t), null;
						} else 2 * Xe() - r.renderingStartTime > gd && n !== 536870912 && (t.flags |= 128, a = !0, xl(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				if (r.tail !== null) {
					e = r.tail;
					a: {
						for (n = e; n !== null;) {
							if (n.alternate !== null) {
								n = !1;
								break a;
							}
							n = n.sibling;
						}
						n = !0;
					}
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Xe(), e.sibling = null, o = Vo.current, o = a ? o & 1 | 2 : o & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || F ? Ho(t, o) : (n = o, O(Po, t), O(Vo, n), Fo === null && (Fo = t)), F && ia(t, r.treeForkCount), e;
				}
				return B(t), null;
			case 22:
			case 23: return Bo(t), No(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (B(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : B(t), n = t.updateQueue, n !== null && bl(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && D(Ja), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Sa(Pa), B(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, B(t), null;
		}
		throw Error(i(156, t.tag));
	}
	function Cl(e, t) {
		switch (sa(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Sa(Pa), Fe(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return Le(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (Bo(t), t.alternate === null) throw Error(i(340));
					I();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (Bo(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					I();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return Uo(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return Fe(), null;
			case 10: return Sa(t.type), null;
			case 22:
			case 23: return Bo(t), No(), e !== null && D(Ja), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Sa(Pa), null;
			case 25: return null;
			default: return null;
		}
	}
	function wl(e, t) {
		switch (sa(t), t.tag) {
			case 3:
				Sa(Pa), Fe();
				break;
			case 26:
			case 27:
			case 5:
				Le(t);
				break;
			case 4:
				Fe();
				break;
			case 31:
				t.memoizedState !== null && Bo(t);
				break;
			case 13:
				Bo(t);
				break;
			case 19:
				Uo(t);
				break;
			case 10:
				Sa(t.type);
				break;
			case 22:
			case 23:
				Bo(t), No(), e !== null && D(Ja);
				break;
			case 24: Sa(Pa);
		}
	}
	function Tl(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function El(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								Z(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Dl(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Oo(t, n);
			} catch (t) {
				Z(e, e.return, t);
			}
		}
	}
	function Ol(e, t, n) {
		n.props = Ec(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Z(e, t, n);
		}
	}
	function kl(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						var i = e.stateNode, a = wi(e.memoizedProps, i);
						(i.ref === null || i.ref.name !== a) && (i.ref = Pp(a)), r = i.ref;
						break;
					case 7:
						if (e.stateNode === null) {
							var o = new Fp(e);
							h(e.child, !1, Qp, o, void 0, void 0), e.stateNode = o;
						}
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Al(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) {
			if (typeof r == "function") try {
				r();
			} catch (n) {
				Z(e, t, n);
			} finally {
				e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
			}
			else if (typeof n == "function") try {
				n(null);
			} catch (n) {
				Z(e, t, n);
			}
			else n.current = null;
		}
	}
	function jl(e, t) {
		if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null) for (var n = 0; n < t.length; n++) em(e.stateNode, t[n]);
	}
	function Ml(e) {
		for (var t = e.return; t !== null && (Fl(t) && em(e.stateNode, t.stateNode), !Pl(t));) t = t.return;
	}
	function Nl(e) {
		for (var t = e.return; t !== null && (Fl(t) && tm(e.stateNode, t.stateNode), !Pl(t));) t = t.return;
	}
	function Pl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 27;
	}
	function Fl(e) {
		return e && e.tag === 7 && e.stateNode !== null;
	}
	function V(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Il(e, t, n) {
		try {
			var r = e.stateNode;
			ip(r, e.type, n, t), r[Nt] = t;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Ll(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Sp(e.type) || e.tag === 4;
	}
	function Rl(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Ll(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Sp(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function zl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = On)), jl(e, r), k = !0;
		else if (i !== 4 && (i === 27 && (jl(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (zl(e, t, n, r), e = e.sibling; e !== null;) zl(e, t, n, r), e = e.sibling;
	}
	function Bl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), jl(e, r), k = !0;
		else if (i !== 4 && (i === 27 && (jl(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (Bl(e, t, n, r), e = e.sibling; e !== null;) Bl(e, t, n, r), e = e.sibling;
	}
	function Vl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			np(t, r, n), t[Mt] = e, t[Nt] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var Hl = !1, Ul = null;
	function Wl(e) {
		(e.tag === 30 || e.subtreeFlags & 33554432) && (Hl = !0);
	}
	var Gl = null;
	function Kl() {
		var e = Gl;
		return Gl = null, e;
	}
	var ql = 0;
	function Jl(e, t, n, r, i) {
		return ql = 0, Yl(e.child, t, n, r, i);
	}
	function Yl(e, t, n, r, i) {
		for (var a = !1; e !== null;) {
			if (e.tag === 5) {
				var o = e.stateNode;
				if (r !== null) {
					var s = Op(o);
					r.push(s), s.view && (a = !0);
				} else a || Op(o).view && (a = !0);
				Hl = !0, Tp(o, ql === 0 ? t : t + "_" + ql, n), ql++;
			} else (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && i || Yl(e.child, t, n, r, i) && (a = !0));
			e = e.sibling;
		}
		return a;
	}
	function Xl(e, t) {
		for (; e !== null;) e.tag === 5 ? Ep(e.stateNode, e.memoizedProps) : (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && t || Xl(e.child, t)), e = e.sibling;
	}
	function Zl(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if ((e.tag !== 22 || e.memoizedState === null) && (Zl(e), e.tag === 30 && e.flags & 18874368 && e.stateNode.paired)) {
				var t = e.memoizedProps;
				if (t.name == null || t.name === "auto") throw Error(i(544));
				var n = t.name;
				t = Ei(t.default, t.share), t !== "none" && (Jl(e, n, t, null, !1) || Xl(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function Ql(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = wi(r, n), a = Ei(r.default, n.paired ? r.share : r.enter);
			a === "none" ? Zl(e) : Jl(e, i, a, null, !1) ? (Zl(e), n.paired || t || Nd(e, r.onEnter)) : Xl(e.child, !1);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Ql(e, t), e = e.sibling;
		else Zl(e);
	}
	function $l(e) {
		if (Ul !== null && Ul.size !== 0) {
			var t = Ul;
			if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
				if (e.tag !== 22 || e.memoizedState === null) {
					if (e.tag === 30 && e.flags & 18874368) {
						var n = e.memoizedProps, r = n.name;
						if (r != null && r !== "auto") {
							var i = t.get(r);
							if (i !== void 0) {
								var a = Ei(n.default, n.share);
								if (a !== "none" && (Jl(e, r, a, null, !1) ? (a = e.stateNode, i.paired = a, a.paired = i, Nd(e, n.onShare)) : Xl(e.child, !1)), t.delete(r), t.size === 0) break;
							}
						}
					}
					$l(e);
				}
				e = e.sibling;
			}
		}
	}
	function eu(e) {
		if (e.tag === 30) {
			var t = e.memoizedProps, n = wi(t, e.stateNode), r = Ul === null ? void 0 : Ul.get(n), i = Ei(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (Jl(e, n, i, null, !1) ? r === void 0 ? Nd(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, Ul.delete(n), Nd(e, t.onShare)) : Xl(e.child, !1)), Ul !== null && $l(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) eu(e), e = e.sibling;
		else Ul !== null && $l(e);
	}
	function tu(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = wi(t, e.stateNode);
				t = Ei(t.default, t.update), e.flags &= -5, t !== "none" && Jl(e, n, t, e.memoizedState = [], !1);
			} else e.subtreeFlags & 33554432 && tu(e);
			e = e.sibling;
		}
	}
	function nu(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if (e.tag !== 22 || e.memoizedState === null) {
				if (e.tag === 30 && e.flags & 18874368) {
					var t = e.stateNode;
					t.paired !== null && (t.paired = null, Xl(e.child, !1));
				}
				nu(e);
			}
			e = e.sibling;
		}
	}
	function ru(e) {
		if (e.tag === 30) e.stateNode.paired = null, Xl(e.child, !1), nu(e);
		else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) ru(e), e = e.sibling;
		else nu(e);
	}
	function iu(e) {
		for (e = e.child; e !== null;) e.tag === 30 ? Xl(e.child, !1) : e.subtreeFlags & 33554432 && iu(e), e = e.sibling;
	}
	function au(e, t, n, r, i, a, o) {
		for (var s = !1; t !== null;) {
			if (t.tag === 5) {
				var c = t.stateNode;
				if (a !== null && ql < a.length) {
					var l = a[ql], u = Op(c);
					(l.view || u.view) && (s = !0);
					var d;
					if (d = !(e.flags & 4)) {
						if (u.clip) d = !0;
						else {
							d = l.rect;
							var f = u.rect;
							d = d.y !== f.y || d.x !== f.x || d.height !== f.height || d.width !== f.width;
						}
					}
					d && (e.flags |= 4), u.abs ? u = !l.abs : (l = l.rect, u = u.rect, u = l.height !== u.height || l.width !== u.width), u && (e.flags |= 32);
				} else e.flags |= 32;
				e.flags & 4 && Tp(c, ql === 0 ? n : n + "_" + ql, i), s && e.flags & 4 || (Gl === null && (Gl = []), Gl.push(c, ql === 0 ? r : r + "_" + ql, t.memoizedProps)), ql++;
			} else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && o ? e.flags |= t.flags & 32 : au(e, t.child, n, r, i, a, o) && (s = !0));
			t = t.sibling;
		}
		return s;
	}
	function ou(e, t) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var n = e.memoizedProps, r = e.stateNode, i = wi(n, r), a = Ei(n.default, n.update);
				if (t) {
					r = r.clones;
					var o = r === null ? null : r.map(kp);
				} else o = e.memoizedState, e.memoizedState = null;
				r = e;
				var s = e.child;
				ql = 0, i = au(r, s, i, i, a, o, !1), e.flags & 4 && i && (t || Nd(e, n.onUpdate));
			} else e.subtreeFlags & 33554432 && ou(e, t);
			e = e.sibling;
		}
	}
	var H = !1, U = !1, su = !1, cu = !1, lu = typeof WeakSet == "function" ? WeakSet : Set, uu = null, du = !1, fu = !1, pu = !1, mu = !1;
	function hu(e, t, n) {
		if (e = e.containerInfo, sp = gh, e = ei(e), ti(e)) {
			if ("selectionStart" in e) var r = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				r = (r = e.ownerDocument) && r.defaultView || window;
				var i = r.getSelection && r.getSelection();
				if (i && i.rangeCount !== 0) {
					r = i.anchorNode;
					var a = i.anchorOffset, o = i.focusNode;
					i = i.focusOffset;
					try {
						r.nodeType, o.nodeType;
					} catch {
						r = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== r || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || i !== 0 && f.nodeType !== 3 || (l = s + i), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === r && ++u === a && (c = s), p === o && ++d === i && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					r = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else r = null;
			}
			r ||= {
				start: 0,
				end: 0
			};
		} else r = null;
		for (cp = {
			focusedElem: e,
			selectionRange: r
		}, gh = !1, n = (n & 335544064) === n, uu = t, t = n ? 9270 : 1024; uu !== null;) {
			if (e = uu, n && (r = e.deletions, r !== null)) for (a = 0; a < r.length; a++) n && eu(r[a]);
			if (e.alternate === null && e.flags & 2) n && Wl(e), gu(n);
			else {
				if (e.tag === 22) {
					if (r = e.alternate, e.memoizedState !== null) {
						r !== null && r.memoizedState === null && n && eu(r), gu(n);
						continue;
					}
					if (r !== null && r.memoizedState !== null) {
						n && Wl(e), gu(n);
						continue;
					}
				}
				r = e.child, (e.subtreeFlags & t) !== 0 && r !== null ? (r.return = e, uu = r) : (n && tu(e), gu(n));
			}
		}
		Ul = null;
	}
	function gu(e) {
		for (; uu !== null;) {
			var t = uu, n = e, r = t.alternate, a = t.flags;
			switch (t.tag) {
				case 0:
				case 11:
				case 15: break;
				case 1:
					if (a & 1024 && r !== null) {
						n = void 0, a = r.memoizedProps, r = r.memoizedState;
						var o = t.stateNode;
						try {
							var s = Ec(t.type, a);
							n = o.getSnapshotBeforeUpdate(s, r), o.__reactInternalSnapshotBeforeUpdate = n;
						} catch (e) {
							Z(t, t.return, e);
						}
					}
					break;
				case 3:
					if (a & 1024) {
						if (r = t.stateNode.containerInfo, n = r.nodeType, n === 9) nm(r);
						else if (n === 1) switch (r.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								nm(r);
								break;
							default: r.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				case 30:
					n && r !== null && (n = wi(r.memoizedProps, r.stateNode), a = t.memoizedProps, a = Ei(a.default, a.update), a !== "none" && Jl(r, n, a, r.memoizedState = [], !0));
					break;
				default: if (a & 1024) throw Error(i(163));
			}
			if (r = t.sibling, r !== null) {
				r.return = t.return, uu = r;
				break;
			}
			uu = t.return;
		}
	}
	function _u(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				Lu(e, n), r & 4 && Tl(5, n);
				break;
			case 1:
				if (Lu(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						Z(n, n.return, e);
					}
					else {
						var i = Ec(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							Z(n, n.return, e);
						}
					}
				}
				r & 64 && Dl(n), r & 512 && kl(n, n.return);
				break;
			case 3:
				if (Lu(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Oo(e, t);
					} catch (e) {
						Z(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Vl(n);
			case 26:
			case 5:
				Lu(e, n), t === null && r & 4 && V(n), r & 512 && kl(n, n.return);
				break;
			case 12:
				Lu(e, n);
				break;
			case 31:
				Lu(e, n), r & 4 && Eu(e, n);
				break;
			case 13:
				Lu(e, n), r & 4 && Du(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = _f.bind(null, n), cm(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || H, !r) {
					var a = t !== null && t.memoizedState !== null || U;
					t = H, i = U, H = r, (U = a) && !i ? (r = 2, n.subtreeFlags & 8772 && (r |= 1), zu(e, n, r)) : Lu(e, n), H = t, U = i;
				}
				break;
			case 30:
				Lu(e, n), r & 512 && kl(n, n.return);
				break;
			case 7: r & 512 && kl(n, n.return);
			default: Lu(e, n);
		}
	}
	function vu(e, t) {
		for (e = e.child; e !== null;) yu(e, t), e = e.sibling;
	}
	function yu(e, t) {
		switch (e.tag) {
			case 5:
			case 26:
				try {
					var n = e.stateNode;
					if (t) {
						var r = n.style;
						typeof r.setProperty == "function" ? r.setProperty("display", "none", "important") : r.display = "none";
					} else {
						var i = e.stateNode, a = e.memoizedProps.style, o = a != null && a.hasOwnProperty("display") ? a.display : null;
						i.style.display = o == null || typeof o == "boolean" ? "" : ("" + o).trim();
					}
				} catch (t) {
					Z(e, e.return, t);
				}
				bu(e, t);
				break;
			case 6:
				try {
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, k = !0;
				} catch (t) {
					Z(e, e.return, t);
				}
				break;
			case 18:
				try {
					var s = e.stateNode;
					t ? wp(s, !0) : wp(e.stateNode, !1);
				} catch (t) {
					Z(e, e.return, t);
				}
				break;
			case 22:
			case 23:
				e.memoizedState === null && vu(e, t);
				break;
			default: vu(e, t);
		}
	}
	function bu(e, t) {
		if (e.subtreeFlags & 67108864) for (e = e.child; e !== null;) {
			a: {
				var n = e, r = t;
				switch (n.tag) {
					case 4:
						yu(n, r);
						break a;
					case 22:
						n.memoizedState === null && bu(n, r);
						break a;
					default: bu(n, r);
				}
			}
			e = e.sibling;
		}
	}
	function xu(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, xu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Vt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var Su = null, Cu = !1;
	function wu(e, t, n) {
		for (n = n.child; n !== null;) Tu(e, t, n), n = n.sibling;
	}
	function Tu(e, t, n) {
		if (ot && typeof ot.onCommitFiberUnmount == "function") try {
			ot.onCommitFiberUnmount(at, n);
		} catch {}
		switch (n.tag) {
			case 26:
				U || Al(n, t), wu(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !U && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				U || Al(n, t), Nl(n);
				var r = Su, i = Cu;
				Sp(n.type) && (Su = n.stateNode, Cu = !1), wu(e, t, n), gm(n.stateNode, n.type, n.memoizedProps), Su = r, Cu = i;
				break;
			case 5: U || Al(n, t), Nl(n);
			case 6:
				if (n.tag === 6 && Nl(n), r = Su, i = Cu, Su = null, wu(e, t, n), Su = r, Cu = i, Su !== null) {
					if (Cu) try {
						(Su.nodeType === 9 ? Su.body : Su.nodeName === "HTML" ? Su.ownerDocument.body : Su).removeChild(n.stateNode), k = !0;
					} catch (e) {
						Z(n, t, e);
					}
					else try {
						Su.removeChild(n.stateNode), k = !0;
					} catch (e) {
						Z(n, t, e);
					}
				}
				break;
			case 18:
				Su !== null && (Cu ? (e = Su, Cp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Hh(e)) : Cp(Su, n.stateNode));
				break;
			case 4:
				r = Su, i = Cu, Su = n.stateNode.containerInfo, Cu = !0, wu(e, t, n), Su = r, Cu = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				El(2, n, t), U || El(4, n, t), wu(e, t, n);
				break;
			case 1:
				U || (Al(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Ol(n, t, r)), wu(e, t, n);
				break;
			case 21:
				wu(e, t, n);
				break;
			case 22:
				U = (r = U) || n.memoizedState !== null, wu(e, t, n), U = r;
				break;
			case 30:
				Al(n, t), wu(e, t, n);
				break;
			case 7:
				U || Al(n, t), wu(e, t, n);
				break;
			default: wu(e, t, n);
		}
	}
	function Eu(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Hh(e);
			} catch (e) {
				Z(t, t.return, e);
			}
		}
	}
	function Du(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Hh(e);
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Ou(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new lu()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new lu()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function ku(e, t) {
		var n = Ou(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = vf.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function Au(e, t, n) {
		var r = t.deletions;
		if (r !== null) for (var a = 0; a < r.length; a++) {
			var o = r[a], s = e, c = t, l = c;
			a: for (; l !== null;) {
				switch (l.tag) {
					case 27:
						if (Sp(l.type)) {
							Su = l.stateNode, Cu = !1;
							break a;
						}
						break;
					case 5:
						Su = l.stateNode, Cu = !1;
						break a;
					case 3:
					case 4:
						Su = l.stateNode.containerInfo, Cu = !0;
						break a;
				}
				l = l.return;
			}
			if (Su === null) throw Error(i(160));
			Tu(s, c, o), Su = null, Cu = !1, s = o.alternate, s !== null && (s.return = null), o.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) Mu(t, e, n), t = t.sibling;
	}
	var ju = null;
	function Mu(e, t, n) {
		var r = e.alternate, a = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (a & 4 && (r = e.updateQueue, r = r === null ? null : r.events, r !== null)) for (var o = 0; o < r.length; o++) {
					var s = r[o];
					s.ref.impl = s.nextImpl;
				}
				Au(t, e, n), Nu(e), a & 4 && (El(3, e, e.return), Tl(3, e), El(5, e, e.return));
				break;
			case 1:
				Au(t, e, n), Nu(e), a & 512 && (U || r === null || Al(r, r.return)), a & 64 && H && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? t : n.concat(t))));
				break;
			case 26:
				if (o = ju, Au(t, e, n), Nu(e), a & 512 && (U || r === null || Al(r, r.return)), a & 4) {
					if (a = r === null ? null : r.memoizedState, n = e.memoizedState, r === null) {
						if (n === null) {
							if (e.stateNode === null) {
								if (H) e.stateNode = fp(e.type, e.memoizedProps, t.containerInfo, e);
								else {
									a: {
										t = e.type, n = e.memoizedProps, a = o.ownerDocument || o;
										b: switch (t) {
											case "title":
												r = a.getElementsByTagName("title")[0], (!r || r[zt] || r[Mt] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = a.createElement(t), a.head.insertBefore(r, a.querySelector("head > title"))), np(r, t, n), r[Mt] = e, Kt(r), t = r;
												break a;
											case "link":
												if (o = Gm("link", "href", a).get(t + (n.href || ""))) {
													for (s = 0; s < o.length; s++) if (r = o[s], r.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && r.getAttribute("rel") === (n.rel == null ? null : n.rel) && r.getAttribute("title") === (n.title == null ? null : n.title) && r.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
														o.splice(s, 1);
														break b;
													}
												}
												r = a.createElement(t), np(r, t, n), a.head.appendChild(r);
												break;
											case "meta":
												if (o = Gm("meta", "content", a).get(t + (n.content || ""))) {
													for (s = 0; s < o.length; s++) if (r = o[s], r.getAttribute("content") === (n.content == null ? null : "" + n.content) && r.getAttribute("name") === (n.name == null ? null : n.name) && r.getAttribute("property") === (n.property == null ? null : n.property) && r.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && r.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
														o.splice(s, 1);
														break b;
													}
												}
												r = a.createElement(t), np(r, t, n), a.head.appendChild(r);
												break;
											default: throw Error(i(468, t));
										}
										r[Mt] = e, Kt(r), t = r;
									}
									e.stateNode = t;
								}
							} else H || Km(o, e.type, e.stateNode);
						} else e.stateNode = Bm(o, n, e.memoizedProps);
					} else a === n ? n === null && e.stateNode !== null && Il(e, e.memoizedProps, r.memoizedProps) : (a === null ? (t = r.stateNode, t === null || U || t.parentNode.removeChild(t)) : a.count--, n === null ? H || Km(o, e.type, e.stateNode) : Bm(o, n, e.memoizedProps));
				}
				break;
			case 27:
				Au(t, e, n), Nu(e), a & 512 && (U || r === null || Al(r, r.return)), r !== null && a & 4 && Il(e, e.memoizedProps, r.memoizedProps);
				break;
			case 5:
				if (o = su, su = !1, Au(t, e, n), su = o, Nu(e), a & 512 && (U || r === null || Al(r, r.return)), e.flags & 32) {
					t = e.stateNode;
					try {
						bn(t, ""), k = !0;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				a & 4 && e.stateNode != null && (t = e.memoizedProps, Il(e, t, r === null ? t : r.memoizedProps)), a & 1024 && (cu = !0);
				break;
			case 6:
				if (Au(t, e, n), Nu(e), a & 4) {
					if (e.stateNode === null) throw Error(i(162));
					t = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = t, k = !0;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				break;
			case 3:
				if (k = !1, Wm = null, o = ju, ju = bm(t.containerInfo), Au(t, e, n), ju = o, Nu(e), a & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					Z(e, e.return, t);
				}
				cu && (cu = !1, Pu(e)), k = !1;
				break;
			case 4:
				a = su, su = H, r = nn(), o = ju, ju = bm(e.stateNode.containerInfo), Au(t, e, n), Nu(e), ju = o, k && fu && (pu = !0), k = r, su = a;
				break;
			case 12:
				Au(t, e, n), Nu(e);
				break;
			case 31:
				Au(t, e, n), Nu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ku(e, t)));
				break;
			case 13:
				Au(t, e, n), Nu(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (md = Xe()), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ku(e, t)));
				break;
			case 22:
				o = e.memoizedState !== null, s = r !== null && r.memoizedState !== null;
				var c = H, l = U, u = su;
				H = c || o, su = u || o, U = l || s, Au(t, e, n), U = l, su = u, H = c, Nu(e), a & 8192 && (t = e.stateNode, t._visibility = o ? t._visibility & -2 : t._visibility | 1, !o || r === null || s || H || U || (t = s || U, n = H, r = U, H = o || H, U = t, Ru(e, 2), H = n, U = r), !o && su || vu(e, o)), a & 4 && (t = e.updateQueue, t !== null && (n = t.retryQueue, n !== null && (t.retryQueue = null, ku(e, n))));
				break;
			case 19:
				Au(t, e, n), Nu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ku(e, t)));
				break;
			case 30:
				a & 512 && (U || r === null || Al(r, r.return)), a = nn(), o = fu, s = (n & 335544064) === n, c = e.memoizedProps, fu = s && Ei(c.default, c.update) !== "none", Au(t, e, n), Nu(e), s && r !== null && k && (e.flags |= 4), fu = o, k = a;
				break;
			case 21: break;
			case 7: a & 512 && (U || r === null || Al(r, r.return)), r && r.stateNode !== null && (r.stateNode._fragmentFiber = e);
			default: Au(t, e, n), Nu(e);
		}
	}
	function Nu(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Ll(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				r = null;
				for (var a = e.return; a !== null;) {
					if (Fl(a)) {
						var o = a.stateNode;
						r === null ? r = [o] : r.push(o);
					}
					if (Pl(a)) break;
					a = a.return;
				}
				var s = r;
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var c = n.stateNode;
						Bl(e, Rl(e), c, s);
						break;
					case 5:
						var l = n.stateNode;
						n.flags & 32 && (bn(l, ""), n.flags &= -33), Bl(e, Rl(e), l, s);
						break;
					case 3:
					case 4:
						var u = n.stateNode.containerInfo;
						zl(e, Rl(e), u, s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				Z(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function Pu(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			Pu(t), t.tag === 5 && t.flags & 1024 && (t = t.stateNode, gh = !0, t.reset(), gh = !1), e = e.sibling;
		}
	}
	function Fu(e, t) {
		if (t.subtreeFlags & 9270) for (t = t.child; t !== null;) Iu(t, e), t = t.sibling;
		else ou(t, !1);
	}
	function Iu(e, t) {
		var n = e.alternate;
		if (n === null) Ql(e, !1);
		else switch (e.tag) {
			case 3:
				if (mu = du = !1, Kl(), Fu(t, e), !du && !pu) {
					if (e = Gl, e !== null) for (var r = 0; r < e.length; r += 3) {
						n = e[r];
						var i = e[r + 1];
						Ep(n, e[r + 2]), n = n.ownerDocument.documentElement, n !== null && n.animate({
							opacity: [0, 0],
							pointerEvents: ["none", "none"]
						}, {
							duration: 0,
							fill: "forwards",
							pseudoElement: "::view-transition-group(" + i + ")"
						});
					}
					e = t.containerInfo, e = e.nodeType === 9 ? e.documentElement : e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "" && (e.style.viewTransitionName = "none", e.animate({
						opacity: [0, 0],
						pointerEvents: ["none", "none"]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition-group(root)"
					}), e.animate({
						width: [0, 0],
						height: [0, 0]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition"
					})), mu = !0;
				}
				Gl = null;
				break;
			case 5:
				Fu(t, e);
				break;
			case 4:
				r = du, du = !1, Fu(t, e), du && (pu = !0), du = r;
				break;
			case 22:
				e.memoizedState === null && (n.memoizedState === null ? Fu(t, e) : Ql(e, !1));
				break;
			case 30:
				r = du, i = Kl(), du = !1, Fu(t, e), du && (e.flags |= 4);
				var a = e.memoizedProps, o = e.stateNode;
				t = wi(a, o), o = wi(n.memoizedProps, o);
				var s = Ei(a.default, a.update);
				s === "none" ? t = !1 : (a = n.memoizedState, n.memoizedState = null, n = e.child, ql = 0, t = au(e, n, t, o, s, a, !0), ql !== (a === null ? 0 : a.length) && (e.flags |= 32)), e.flags & 4 && t ? (Nd(e, e.memoizedProps.onUpdate), Gl = i) : i !== null && (i.push.apply(i, Gl), Gl = i), du = e.flags & 32 ? !0 : r;
				break;
			default: Fu(t, e);
		}
	}
	function Lu(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) _u(e, t.alternate, t), t = t.sibling;
	}
	function Ru(e, t) {
		for (e = e.child; e !== null;) {
			var n = e, r = t;
			switch (n.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					El(4, n, n.return), Ru(n, r);
					break;
				case 1:
					Al(n, n.return);
					var i = n.stateNode;
					typeof i.componentWillUnmount == "function" && Ol(n, n.return, i), Ru(n, r);
					break;
				case 27: r & 2 && gm(n.stateNode, n.type, n.memoizedProps);
				case 5:
					Al(n, n.return), n.tag !== 5 && n.tag !== 27 || Nl(n), Ru(n, r);
					break;
				case 6:
					Nl(n);
					break;
				case 26:
					Al(n, n.return), i = n.stateNode, n.memoizedState !== null || i === null || U || i.parentNode.removeChild(i), Ru(n, r);
					break;
				case 22:
					n.memoizedState === null && Ru(n, r);
					break;
				case 30:
					Al(n, n.return), Ru(n, r);
					break;
				case 7: Al(n, n.return);
				default: Ru(n, r);
			}
			e = e.sibling;
		}
	}
	function zu(e, t, n) {
		for (n = t.subtreeFlags & 8772 ? n : n & -2, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags, s = !!(n & 1);
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					zu(i, a, n), Tl(4, a);
					break;
				case 1:
					if (zu(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Z(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var c = r.stateNode;
						try {
							var l = i.shared.hiddenCallbacks;
							if (l !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < l.length; i++) Do(l[i], c);
						} catch (e) {
							Z(r, r.return, e);
						}
					}
					s && o & 64 && Dl(a), kl(a, a.return);
					break;
				case 27: n & 2 && Vl(a);
				case 5:
					a.tag !== 5 && a.tag !== 27 || Ml(a), zu(i, a, n), s && r === null && o & 4 && V(a), kl(a, a.return);
					break;
				case 6:
					Ml(a);
					break;
				case 26:
					c = a.stateNode, a.memoizedState !== null || c === null || H || Km(bm(c.ownerDocument), a.type, c), zu(i, a, n), s && r === null && o & 4 && V(a), kl(a, a.return);
					break;
				case 12:
					zu(i, a, n);
					break;
				case 31:
					zu(i, a, n), s && o & 4 && Eu(i, a);
					break;
				case 13:
					zu(i, a, n), s && o & 4 && Du(i, a);
					break;
				case 22:
					a.memoizedState === null && zu(i, a, n), kl(a, a.return);
					break;
				case 30:
					zu(i, a, n), kl(a, a.return);
					break;
				case 7: kl(a, a.return);
				default: zu(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Bu(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && Ia(n));
	}
	function Vu(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ia(e));
	}
	function Hu(e, t, n, r) {
		var i = (n & 335544064) === n;
		if (t.subtreeFlags & (i ? 10262 : 10256)) for (t = t.child; t !== null;) Uu(e, t, n, r), t = t.sibling;
		else i && iu(t);
	}
	function Uu(e, t, n, r) {
		var i = (n & 335544064) === n;
		i && t.alternate === null && t.return !== null && t.return.alternate !== null && ru(t);
		var a = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Hu(e, t, n, r), a & 2048 && Tl(9, t);
				break;
			case 1:
				Hu(e, t, n, r);
				break;
			case 3:
				Hu(e, t, n, r), i && mu && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && Ia(a)));
				break;
			case 12:
				if (a & 2048) {
					Hu(e, t, n, r), a = t.stateNode;
					try {
						var o = t.memoizedProps, s = o.id, c = o.onPostCommit;
						typeof c == "function" && c(s, t.alternate === null ? "mount" : "update", a.passiveEffectDuration, -0);
					} catch (e) {
						Z(t, t.return, e);
					}
				} else Hu(e, t, n, r);
				break;
			case 31:
				Hu(e, t, n, r);
				break;
			case 13:
				Hu(e, t, n, r);
				break;
			case 23: break;
			case 22:
				o = t.stateNode, s = t.alternate, t.memoizedState === null ? (i && s !== null && s.memoizedState !== null && ru(t), o._visibility & 2 ? Hu(e, t, n, r) : (o._visibility |= 2, Wu(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))) : (i && s !== null && s.memoizedState === null && ru(s), o._visibility & 2 ? Hu(e, t, n, r) : Gu(e, t)), a & 2048 && Bu(s, t);
				break;
			case 24:
				Hu(e, t, n, r), a & 2048 && Vu(t.alternate, t);
				break;
			case 30:
				i && (a = t.alternate, a !== null && (Xl(a.child, !0), Xl(t.child, !0))), Hu(e, t, n, r);
				break;
			default: Hu(e, t, n, r);
		}
	}
	function Wu(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Wu(a, o, s, c, i), Tl(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Wu(a, o, s, c, i)) : u._visibility & 2 ? Wu(a, o, s, c, i) : Gu(a, o), i && l & 2048 && Bu(o.alternate, o);
					break;
				case 24:
					Wu(a, o, s, c, i), i && l & 2048 && Vu(o.alternate, o);
					break;
				default: Wu(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Gu(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Gu(n, r), i & 2048 && Bu(r.alternate, r);
					break;
				case 24:
					Gu(n, r), i & 2048 && Vu(r.alternate, r);
					break;
				default: Gu(n, r);
			}
			t = t.sibling;
		}
	}
	var Ku = 8192;
	function qu(e, t, n) {
		if (e.subtreeFlags & Ku) for (e = e.child; e !== null;) Ju(e, t, n), e = e.sibling;
	}
	function Ju(e, t, n) {
		switch (e.tag) {
			case 26:
				qu(e, t, n), e.flags & Ku && (e.memoizedState === null ? (e = e.stateNode, (t & 335544128) === t && Zm(n, e)) : Qm(n, ju, e.memoizedState, e.memoizedProps));
				break;
			case 5:
				qu(e, t, n), e.flags & Ku && (e = e.stateNode, (t & 335544128) === t && Zm(n, e));
				break;
			case 3:
			case 4:
				var r = ju;
				ju = bm(e.stateNode.containerInfo), qu(e, t, n), ju = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Ku, Ku = 16777216, qu(e, t, n), Ku = r) : qu(e, t, n));
				break;
			case 30:
				if ((e.flags & Ku) !== 0 && (r = e.memoizedProps.name, r != null && r !== "auto")) {
					var i = e.stateNode;
					i.paired = null, Ul === null && (Ul = /* @__PURE__ */ new Map()), Ul.set(r, i);
				}
				qu(e, t, n);
				break;
			default: qu(e, t, n);
		}
	}
	function Yu(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Xu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				uu = r, $u(r, e);
			}
			Yu(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Zu(e), e = e.sibling;
	}
	function Zu(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Xu(e), e.flags & 2048 && El(9, e, e.return);
				break;
			case 3:
				Xu(e);
				break;
			case 12:
				Xu(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Qu(e)) : Xu(e);
				break;
			default: Xu(e);
		}
	}
	function Qu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				uu = r, $u(r, e);
			}
			Yu(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					El(8, t, t.return), Qu(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Qu(t));
					break;
				default: Qu(t);
			}
			e = e.sibling;
		}
	}
	function $u(e, t) {
		for (; uu !== null;) {
			var n = uu;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					El(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: Ia(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, uu = r;
			else a: for (n = e; uu !== null;) {
				r = uu;
				var i = r.sibling, a = r.return;
				if (xu(r), r === n) {
					uu = null;
					break a;
				}
				if (i !== null) {
					i.return = a, uu = i;
					break a;
				}
				uu = a;
			}
		}
	}
	var ed = {
		getCacheForType: function(e) {
			var t = Oa(Pa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return Oa(Pa).controller.signal;
		}
	}, td = typeof WeakMap == "function" ? WeakMap : Map, W = 0, G = null, K = null, q = 0, J = 0, nd = null, rd = !1, id = !1, ad = !1, od = 0, Y = 0, sd = 0, cd = 0, ld = 0, ud = 0, dd = 0, X = null, fd = null, pd = !1, md = 0, hd = 0, gd = Infinity, _d = null, vd = null, yd = 0, bd = null, xd = null, Sd = 0, Cd = 0, wd = null, Td = null, Ed = null, Dd = null, Od = null, kd = 0, Ad = null;
	function jd() {
		return W & 2 && q !== 0 ? q & -q : T.T === null ? kt() : Pf();
	}
	function Md() {
		if (ud === 0) {
			if (!(q & 536870912) || F) {
				var e = pt;
				pt <<= 1, !(pt & 3932160) && (pt = 262144), ud = e;
			} else ud = 536870912;
		}
		return e = Po.current, e !== null && (e.flags |= 32), ud;
	}
	function Nd(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(wi(e.memoizedProps, n))), Dd === null && (Dd = []), Dd.push(t.bind(null, r));
		}
	}
	function Pd(e, t, n) {
		(e === G && (J === 2 || J === 9) || e.cancelPendingCommit !== null) && (Vd(e, 0), Rd(e, q, ud, !1)), St(e, n), (!(W & 2) || e !== G) && (e === G && (!(W & 2) && (cd |= n), Y === 4 && Rd(e, q, ud, !1)), Ef(e));
	}
	function Fd(e, t, n) {
		if (W & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || _t(e, t), a = r ? Yd(e, t) : qd(e, t, !0), o = r;
		do {
			if (a === 0) {
				id && !r && Rd(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !Ld(n)) {
				a = qd(e, t, !1), o = !1;
				continue;
			}
			if (a === 2) {
				if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
				else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
				if (s !== 0) {
					t = s;
					a: {
						var c = e;
						a = X;
						var l = c.current.memoizedState.isDehydrated;
						if (l && (Vd(c, s).flags |= 256), s = qd(c, s, !1), s !== 2 && s !== 6) {
							if (ad && !l) {
								c.errorRecoveryDisabledLanes |= o, cd |= o, a = 4;
								break a;
							}
							o = fd, fd = a, o !== null && (fd === null ? fd = o : fd.push.apply(fd, o));
						}
						a = s;
					}
					if (o = !1, a !== 2) continue;
				}
			}
			if (a === 1) {
				Vd(e, 0), Rd(e, t, 0, !0);
				break;
			}
			a: {
				switch (r = e, o = a, o) {
					case 0:
					case 1: throw Error(i(345));
					case 4: if ((t & 4194048) !== t && (t & 62914560) !== t) break;
					case 6:
						Rd(r, t, ud, !rd);
						break a;
					case 2:
						fd = null;
						break;
					case 3:
					case 5: break;
					default: throw Error(i(329));
				}
				if ((t & 62914560) === t && (a = md + 300 - Xe(), 10 < a)) {
					if (Rd(r, t, ud, !rd), gt(r, 0, !0) !== 0) break a;
					Sd = t, r.timeoutHandle = gp(Id.bind(null, r, n, fd, _d, pd, t, ud, cd, dd, rd, o, "Throttled", -0, 0), a);
					break a;
				}
				Id(r, n, fd, _d, pd, t, ud, cd, dd, rd, o, null, -0, 0);
			}
			break;
		} while (1);
		Ef(e);
	}
	function Id(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		e.timeoutHandle = -1;
		var m = t.subtreeFlags, h = (a & 335544064) === a;
		if (d = null, (h || m & 8192 || (m & 16785408) == 16785408) && (d = {
			stylesheets: null,
			count: 0,
			imgCount: 0,
			imgBytes: 0,
			suspenseyImages: [],
			waitingForImages: !0,
			waitingForViewTransition: !1,
			unsuspend: On
		}, Ul = null, Ju(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? md - Xe() : (a & 4194048) === a ? hd - Xe() : 0, m = eh(d, m), m !== null)) {
			Sd = a, e.cancelPendingCommit = m(nf.bind(null, e, t, a, n, r, i, o, s, c, l, u, d, null, f, p)), Rd(e, a, o, !l);
			return;
		}
		nf(e, t, a, n, r, i, o, s, c, l, u, d);
	}
	function Ld(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Jr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function Rd(e, t, n, r) {
		t = vt(e, t), t &= ~ld, t &= ~cd, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - ct(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && wt(e, n, t);
	}
	function zd() {
		return W & 6 ? !0 : (Df(0, !1), !1);
	}
	function Bd() {
		if (K !== null) {
			if (J === 0) var e = K.return;
			else e = K, L = ba = null, cs(e), co = null, lo = 0, e = K;
			for (; e !== null;) wl(e.alternate, e), e = e.return;
			K = null;
		}
	}
	function Vd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), Sd = 0, Bd(), G = e, K = n = Vi(e.current, null), q = t, J = 0, nd = null, rd = !1, id = _t(e, t), ad = !1, dd = ud = ld = cd = sd = Y = 0, fd = X = null, pd = !1, od = vt(e, t), ji(), n;
	}
	function Hd(e, t) {
		R = null, T.H = vc, t === Qa || t === eo ? (t = oo(), J = 3) : t === $a ? (t = oo(), J = 4) : J = t === Ic ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, nd = t, K === null && (Y = 1, Ac(e, Yi(t, e.current)));
	}
	function Ud() {
		var e = Po.current;
		return e === null ? !0 : (q & 4194048) === q ? Fo === null : (q & 62914560) === q || q & 536870912 ? e === Fo : !1;
	}
	function Wd() {
		var e = T.H;
		return T.H = vc, e === null ? vc : e;
	}
	function Gd() {
		var e = T.A;
		return T.A = ed, e;
	}
	function Kd() {
		Y = 4, rd || (q & 4194048) !== q && Po.current !== null || (id = !0), !(sd & 134217727) && !(cd & 134217727) || G === null || Rd(G, q, ud, !1);
	}
	function qd(e, t, n) {
		var r = W;
		W |= 2;
		var i = Wd(), a = Gd();
		(G !== e || q !== t) && (_d = null, Vd(e, t)), t = !1;
		var o = Y;
		a: do
			try {
				if (J !== 0 && K !== null) {
					var s = K, c = nd;
					switch (J) {
						case 8:
							Bd(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							Po.current === null && (t = !0);
							var l = J;
							if (J = 0, nd = null, $d(e, s, c, l), n && id) {
								o = 0;
								break a;
							}
							break;
						default: l = J, J = 0, nd = null, $d(e, s, c, l);
					}
				}
				Jd(), o = Y;
				break;
			} catch (t) {
				Hd(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, L = ba = null, W = r, T.H = i, T.A = a, K === null && (G = null, q = 0, ji()), o;
	}
	function Jd() {
		for (; K !== null;) Zd(K);
	}
	function Yd(e, t) {
		var n = W;
		W |= 2;
		var r = Wd(), a = Gd();
		G !== e || q !== t ? (_d = null, gd = Xe() + 500, Vd(e, t)) : id = _t(e, t);
		a: do
			try {
				if (J !== 0 && K !== null) {
					t = K;
					var o = nd;
					b: switch (J) {
						case 1:
							J = 0, nd = null, $d(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (no(o)) {
								J = 0, nd = null, Qd(t);
								break;
							}
							t = function() {
								J !== 2 && J !== 9 || G !== e || (J = 7), Ef(e);
							}, o.then(t, t);
							break a;
						case 3:
							J = 7;
							break a;
						case 4:
							J = 5;
							break a;
						case 7:
							no(o) ? (J = 0, nd = null, Qd(t)) : (J = 0, nd = null, $d(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (K.tag) {
								case 26: s = K.memoizedState;
								case 5:
								case 27:
									var c = K;
									if (s ? Ym(s) : c.stateNode.complete) {
										J = 0, nd = null;
										var l = c.sibling;
										if (l !== null) K = l;
										else {
											var u = c.return;
											u === null ? K = null : (K = u, ef(u));
										}
										break b;
									}
							}
							J = 0, nd = null, $d(e, t, o, 5);
							break;
						case 6:
							J = 0, nd = null, $d(e, t, o, 6);
							break;
						case 8:
							Bd(), Y = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				Xd();
				break;
			} catch (t) {
				Hd(e, t);
			}
		while (1);
		return L = ba = null, T.H = r, T.A = a, W = n, K === null ? (G = null, q = 0, ji(), Y) : 0;
	}
	function Xd() {
		for (; K !== null && !Je();) Zd(K);
	}
	function Zd(e) {
		var t = gl(e.alternate, e, od);
		e.memoizedProps = e.pendingProps, t === null ? ef(e) : K = t;
	}
	function Qd(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = Xc(n, t, t.pendingProps, t.type, void 0, q);
				break;
			case 11:
				t = Xc(n, t, t.pendingProps, t.type.render, t.ref, q);
				break;
			case 5:
				cs(t);
				var r = t;
				r === la && (F ? (ha(r), r.tag === 5 && r.stateNode != null && (P = r.stateNode)) : (ha(r), F = !0));
			default: wl(n, t), t = K = Hi(t, od), t = gl(n, t, od);
		}
		e.memoizedProps = e.pendingProps, t === null ? ef(e) : K = t;
	}
	function $d(e, t, n, r) {
		L = ba = null, cs(t), co = null, lo = 0;
		var i = t.return;
		try {
			if (Fc(e, i, t, n, q)) {
				Y = 1, Ac(e, Yi(n, e.current)), K = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw K = i, t;
			Y = 1, Ac(e, Yi(n, e.current)), K = null;
			return;
		}
		t.flags & 32768 ? (F || r === 1 ? e = !0 : id || q & 536870912 ? e = !1 : (rd = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = Po.current, r !== null && r.tag === 13 && (r.flags |= 16384))), tf(t, e)) : ef(t);
	}
	function ef(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				tf(t, rd);
				return;
			}
			e = t.return;
			var n = Sl(t.alternate, t, od);
			if (n !== null) {
				K = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				K = t;
				return;
			}
			K = t = e;
		} while (t !== null);
		Y === 0 && (Y = 5);
	}
	function tf(e, t) {
		do {
			var n = Cl(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, K = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				K = e;
				return;
			}
			K = e = n;
		} while (e !== null);
		Y = 6, K = null;
	}
	function nf(e, t, n, r, a, o, s, c, l, u, d, f) {
		e.cancelPendingCommit = null;
		do
			df();
		while (yd !== 0);
		if (W & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			e === G && (K = G = null, q = 0), xd = t, bd = e, Sd = n, wd = a, Td = r, rf(e, t, n, s, c, l, f);
		}
	}
	function rf(e, t, n, r, i, a, o) {
		var s = t.lanes | t.childLanes;
		if (Cd = s, s |= Ai, Ct(e, n, s, r, i, a), Dd = null, (n & 335544064) === n ? (Od = za(e), r = 10262) : (Od = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, yf(et, function() {
			return ff(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Hl = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = T.T, T.T = null, i = E.p, E.p = 2, a = W, W |= 4;
			try {
				hu(e, t, n);
			} finally {
				W = a, E.p = i, T.T = r;
			}
		}
		yd = 1, Hl ? Ed = Mp(o, e.containerInfo, Od, sf, cf, of, lf, ff, af, null, null) : (sf(), cf(), lf());
	}
	function af(e) {
		if (yd !== 0) {
			var t = bd.onRecoverableError;
			t(e, { componentStack: null });
		}
	}
	function of() {
		yd === 3 && (yd = 0, Iu(xd, bd), yd = 4);
	}
	function sf() {
		if (yd === 1) {
			yd = 0;
			var e = bd, t = xd, n = Sd, r = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || r) {
				r = T.T, T.T = null;
				var i = E.p;
				E.p = 2;
				var a = W;
				W |= 4;
				try {
					fu = pu = !1, Mu(t, e, n), n = cp;
					var o = ei(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && $r(s.ownerDocument.documentElement, s)) {
						if (c !== null && ti(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Qr(s, h), v = Qr(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					gh = !!sp, cp = sp = null;
				} finally {
					W = a, E.p = i, T.T = r;
				}
			}
			e.current = t, yd = 2;
		}
	}
	function cf() {
		if (yd === 2) {
			yd = 0;
			var e = bd, t = xd, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = T.T, T.T = null;
				var r = E.p;
				E.p = 2;
				var i = W;
				W |= 4;
				try {
					_u(e, t.alternate, t);
				} finally {
					W = i, E.p = r, T.T = n;
				}
			}
			yd = 3;
		}
	}
	function lf() {
		if (yd === 4 || yd === 3) {
			yd = 0;
			var e = Ed;
			Ed = null, Ye();
			var t = bd, n = xd, r = Sd, i = Td, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? yd = 5 : (yd = 0, xd = bd = null, uf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (vd = null), Ot(r), n = n.stateNode, ot && typeof ot.onCommitFiberRoot == "function") try {
				ot.onCommitFiberRoot(at, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = T.T, a = E.p, E.p = 2, T.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					T.T = n, E.p = a;
				}
			}
			if (i = Dd, o = Od, Od = null, i !== null && (Dd = null, o === null && (o = []), e !== null)) for (c = 0; c < i.length; c++) n = (0, i[c])(o), n !== void 0 && e.finished.finally(n);
			Sd & 3 && df(), Ef(t), a = t.pendingLanes, r & 261930 && a & 42 ? t === Ad ? kd++ : (kd = 0, Ad = t) : (kd = 0, Ad = null), Df(0, !1);
		}
	}
	function uf(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, Ia(t)));
	}
	function df() {
		return Ed !== null && (Ed.skipTransition(), Ed = null), sf(), cf(), lf(), ff();
	}
	function ff() {
		if (yd !== 5) return !1;
		var e = bd, t = Cd;
		Cd = 0;
		var n = Ot(Sd), r = T.T, a = E.p;
		try {
			E.p = 32 > n ? 32 : n, T.T = null, n = wd, wd = null;
			var o = bd, s = Sd;
			if (yd = 0, xd = bd = null, Sd = 0, W & 6) throw Error(i(331));
			var c = W;
			if (W |= 4, Zu(o.current), Uu(o, o.current, s, n), W = c, Df(0, !1), ot && typeof ot.onPostCommitFiberRoot == "function") try {
				ot.onPostCommitFiberRoot(at, o);
			} catch {}
			return !0;
		} finally {
			E.p = a, T.T = r, uf(e, t);
		}
	}
	function pf(e, t, n) {
		t = Yi(n, t), t = Mc(e.stateNode, t, 2), e = xo(e, t, 2), e !== null && (St(e, 2), Ef(e));
	}
	function Z(e, t, n) {
		if (e.tag === 3) pf(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				pf(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (vd === null || !vd.has(r))) {
					e = Yi(n, e), n = Nc(2), r = xo(t, n, 2), r !== null && (Pc(n, r, t, e), St(r, 2), Ef(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function mf(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new td();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (ad = !0, i.add(n), e = hf.bind(null, e, t, n), t.then(e, e));
	}
	function hf(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, G === e && (q & n) === n && (Y === 4 || Y === 3 && (q & 62914560) === q && 300 > Xe() - md ? W & 2 ? ld |= n : Vd(e, 0) : ld |= n, dd === q && (dd = 0)), Ef(e);
	}
	function gf(e, t) {
		t === 0 && (t = bt()), e = Pi(e, t), e !== null && (St(e, t), Ef(e));
	}
	function _f(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), gf(e, n);
	}
	function vf(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), gf(e, n);
	}
	function yf(e, t) {
		return Ke(e, t);
	}
	var bf = null, xf = null, Sf = !1, Cf = !1, wf = !1, Tf = 0;
	function Ef(e) {
		e !== xf && e.next === null && (xf === null ? bf = xf = e : xf = xf.next = e), Cf = !0, Sf || (Sf = !0, Nf());
	}
	function Df(e, t) {
		if (!wf && Cf) {
			wf = !0;
			do
				for (var n = !1, r = bf; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - ct(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, Mf(r, a));
						} else a = q, a = gt(r, r === G ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || _t(r, a) || (n = !0, Mf(r, a));
					}
					r = r.next;
				}
			while (n);
			wf = !1;
		}
	}
	function Of() {
		kf();
	}
	function kf() {
		Cf = Sf = !1;
		var e = 0;
		Tf !== 0 && hp() && (e = Tf);
		for (var t = Xe(), n = null, r = bf; r !== null;) {
			var i = r.next, a = Af(r, t);
			a === 0 ? (r.next = null, n === null ? bf = i : n.next = i, i === null && (xf = n)) : (n = r, (e !== 0 || a & 3) && (Cf = !0)), r = i;
		}
		yd !== 0 && yd !== 5 || Df(e, !1), Tf !== 0 && (Tf = 0);
	}
	function Af(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - ct(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = yt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = G, n = q, n = gt(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (J === 2 || J === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && qe(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || _t(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && qe(r), Ot(n)) {
				case 2:
				case 8:
					n = $e;
					break;
				case 32:
					n = et;
					break;
				case 268435456:
					n = nt;
					break;
				default: n = et;
			}
			return r = jf.bind(null, e), n = Ke(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && qe(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function jf(e, t) {
		if (yd !== 0 && yd !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (df() && e.callbackNode !== n) return null;
		var r = q;
		return r = gt(e, e === G ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Fd(e, r, t), Af(e, Xe()), e.callbackNode != null && e.callbackNode === n ? jf.bind(null, e) : null);
	}
	function Mf(e, t) {
		if (df()) return null;
		Fd(e, t, !0);
	}
	function Nf() {
		bp(function() {
			W & 6 ? Ke(Qe, Of) : kf();
		});
	}
	function Pf() {
		if (Tf === 0) {
			var e = Ha;
			e === 0 && (e = ft, ft <<= 1, !(ft & 261888) && (ft = 256)), Tf = e;
		}
		return Tf;
	}
	function Ff(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : Dn(e);
	}
	function If(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Ff((i[Nt] || null).action), o = r.submitter;
			o && (t = (t = o[Nt] || null) ? Ff(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new Yn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (Tf !== 0) {
								var e = new FormData(i, o);
								ic(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = new FormData(i, o), ic(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var Lf = 0; Lf < xi.length; Lf++) {
		var Rf = xi[Lf];
		Si(Rf.toLowerCase(), "on" + (Rf[0].toUpperCase() + Rf.slice(1)));
	}
	Si(pi, "onAnimationEnd"), Si(mi, "onAnimationIteration"), Si(hi, "onAnimationStart"), Si("dblclick", "onDoubleClick"), Si("focusin", "onFocus"), Si("focusout", "onBlur"), Si(gi, "onTransitionRun"), Si(_i, "onTransitionStart"), Si(vi, "onTransitionCancel"), Si(yi, "onTransitionEnd"), Zt("onMouseEnter", ["mouseout", "mouseover"]), Zt("onMouseLeave", ["mouseout", "mouseover"]), Zt("onPointerEnter", ["pointerout", "pointerover"]), Zt("onPointerLeave", ["pointerout", "pointerover"]), Xt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Xt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Xt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Xt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Xt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Xt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var zf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Bf = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(zf));
	function Vf(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Di(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Di(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Q(e, t) {
		var n = t[Ft];
		n === void 0 && (n = t[Ft] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Gf(t, e, 2, !1), n.add(r));
	}
	function Hf(e, t, n) {
		var r = 0;
		t && (r |= 4), Gf(n, e, r, t);
	}
	var Uf = "_reactListening" + Math.random().toString(36).slice(2);
	function Wf(e) {
		if (!e[Uf]) {
			e[Uf] = !0, Jt.forEach(function(t) {
				t !== "selectionchange" && (Bf.has(t) || Hf(t, !1, e), Hf(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[Uf] || (t[Uf] = !0, Hf("selectionchange", !1, t));
		}
	}
	function Gf(e, t, n, r) {
		switch (Ch(t)) {
			case 2:
				var i = _h;
				break;
			case 8:
				i = vh;
				break;
			default: i = yh;
		}
		n = i.bind(null, t, n, e), i = void 0, !Rn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function Kf(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = Ht(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		Fn(function() {
			var r = a, i = An(n), s = [];
			a: {
				var c = bi.get(e);
				if (c !== void 0) {
					var l = Yn, u = e;
					switch (e) {
						case "keypress": if (Wn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = fr;
							break;
						case "focusin":
							u = "focus", l = rr;
							break;
						case "focusout":
							u = "blur", l = rr;
							break;
						case "beforeblur":
						case "afterblur":
							l = rr;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = nr;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = A;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = hr;
							break;
						case pi:
						case mi:
						case hi:
							l = ir;
							break;
						case yi:
							l = gr;
							break;
						case "scroll":
						case "scrollend":
							l = Zn;
							break;
						case "wheel":
							l = _r;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = ar;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = pr;
							break;
						case "submit":
							l = mr;
							break;
						case "toggle":
						case "beforetoggle": l = vr;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = In(m, p), g != null && d.push(qf(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (l = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", l && n !== kn && (u = n.relatedTarget || n.fromElement) && (Ht(u) || u[Pt])) break a;
					(c || l) && (u = i.window === i ? i : (l = i.ownerDocument) ? l.defaultView || l.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? Ht(l) : null, l !== null && (f = o(l), d = l.tag, l !== f || d !== 5 && d !== 27 && d !== 6) && (l = null)) : (c = null, l = r), c !== l && (d = nr, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = pr, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = c == null ? u : Wt(c), h = l == null ? u : Wt(l), u = new d(g, m + "leave", c, n, i), u.target = f, u.relatedTarget = h, g = null, Ht(i) === r && (d = new d(p, m + "enter", l, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = c && l ? ne(c, l, Yf) : null, c !== null && Xf(s, u, c, d, !1), l !== null && f !== null && Xf(s, f, l, d, !0)));
				}
				a: {
					if (c = r ? Wt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var _ = Lr;
					else if (Mr(c)) {
						if (Rr) _ = Kr;
						else {
							_ = Wr;
							var v = Ur;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && wn(r.elementType) && (_ = Lr) : _ = Gr;
					if (_ &&= _(e, r)) {
						Nr(s, _, n, i);
						break a;
					}
					v && v(e, c, r);
				}
				switch (v = r ? Wt(r) : window, e) {
					case "focusin":
						(Mr(v) || v.contentEditable === "true") && (ri = v, ii = r, ai = null);
						break;
					case "focusout":
						ai = ii = ri = null;
						break;
					case "mousedown":
						oi = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						oi = !1, si(s, n, i);
						break;
					case "selectionchange": if (ni) break;
					case "keydown":
					case "keyup": si(s, n, i);
				}
				var y;
				if (br) b: {
					switch (e) {
						case "compositionstart":
							var b = "onCompositionStart";
							break b;
						case "compositionend":
							b = "onCompositionEnd";
							break b;
						case "compositionupdate":
							b = "onCompositionUpdate";
							break b;
					}
					b = void 0;
				}
				else Or ? Er(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (Cr && n.locale !== "ko" && (Or || b !== "onCompositionStart" ? b === "onCompositionEnd" && Or && (y = Un()) : (Bn = i, Vn = "value" in Bn ? Bn.value : Bn.textContent, Or = !0)), v = Jf(r, b), 0 < v.length && (b = new or(b, e, null, n, i), s.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = Dr(n), y !== null && (b.data = y)))), (y = Sr ? kr(e, n) : Ar(e, n)) && (b = Jf(r, "onBeforeInput"), 0 < b.length && (v = new or("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: v,
					listeners: b
				}), v.data = y)), If(s, e, r, n, i);
			}
			Vf(s, t);
		});
	}
	function qf(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Jf(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = In(e, n), i != null && r.unshift(qf(e, i, a)), i = In(e, t), i != null && r.push(qf(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Yf(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Xf(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = In(n, a), l != null && o.unshift(qf(n, l, c))) : i || (l = In(n, a), l != null && o.push(qf(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Zf = /\r\n?/g, Qf = /\u0000|\uFFFD/g;
	function $f(e) {
		return (typeof e == "string" ? e : "" + e).replace(Zf, "\n").replace(Qf, "");
	}
	function ep(e, t) {
		return t = $f(t), $f(e) === t;
	}
	function $(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || bn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && bn(e, "" + r);
				else return;
				break;
			case "className":
				an(e, "class", r);
				break;
			case "tabIndex":
				an(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				an(e, n, r);
				break;
			case "style":
				Cn(e, r, o);
				return;
			case "data": if (t !== "object") {
				an(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href")) {
					e.removeAttribute(n);
					break;
				}
				if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Dn(r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof o == "function" && (n === "formAction" ? (t !== "input" && $(e, t, "name", a.name, a, null), $(e, t, "formEncType", a.formEncType, a, null), $(e, t, "formMethod", a.formMethod, a, null), $(e, t, "formTarget", a.formTarget, a, null)) : ($(e, t, "encType", a.encType, a, null), $(e, t, "method", a.method, a, null), $(e, t, "target", a.target, a, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Dn(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = On);
				return;
			case "onScroll":
				r != null && Q("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						o?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = Dn(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "credentialless":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				Q("beforetoggle", e), Q("toggle", e), rn(e, "popover", r);
				break;
			case "xlinkActuate":
				on(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				on(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				on(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				on(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				on(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				on(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				on(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				on(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				on(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				rn(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = Tn.get(n) || n, rn(e, n, r);
			else return;
		}
		k = !0;
	}
	function tp(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				Cn(e, r, o);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						o?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "children":
				if (typeof r == "string") bn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") bn(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = On);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!Yt.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), o = n.slice(2, a ? n.length - 7 : void 0), t = e[Nt] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(o, t, a), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(o, r, a);
						break a;
					}
					k = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : rn(e, n, r);
				}
				return;
		}
		k = !0;
	}
	function np(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				Q("error", e), Q("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: $(e, t, o, s, n, null);
					}
				}
				a && $(e, t, "srcSet", n.srcSet, n, null), r && $(e, t, "src", n.src, n, null);
				return;
			case "input":
				Q("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: $(e, t, r, d, n, null);
					}
				}
				hn(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in Q("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: $(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && _n(e, !!r, n, !0) : _n(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in Q("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: $(e, t, s, c, n, null);
				}
				yn(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: $(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				Q("beforetoggle", e), Q("toggle", e), Q("cancel", e), Q("close", e);
				break;
			case "iframe":
			case "object":
				Q("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < zf.length; r++) Q(zf[r], e);
				break;
			case "image":
				Q("error", e), Q("load", e);
				break;
			case "details":
				Q("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": Q("error", e), Q("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: $(e, t, u, r, n, null);
				}
				return;
			default: if (wn(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && tp(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && $(e, t, c, r, n, null));
	}
	var rp = {};
	function ip(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || $(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							m !== f && (k = !0), o = m;
							break;
						case "name":
							m !== f && (k = !0), a = m;
							break;
						case "checked":
							m !== f && (k = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (k = !0), d = m;
							break;
						case "value":
							m !== f && (k = !0), s = m;
							break;
						case "defaultValue":
							m !== f && (k = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && $(e, t, p, m, r, f);
					}
				}
				mn(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || $(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						o !== l && (k = !0), p = o;
						break;
					case "defaultValue":
						o !== l && (k = !0), c = o;
						break;
					case "multiple": o !== l && (k = !0), s = o;
					default: o !== l && $(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? _n(e, !!n, n ? [] : "", !1) : _n(e, !!n, t, !0)) : _n(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: $(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						a !== o && (k = !0), p = a;
						break;
					case "defaultValue":
						a !== o && (k = !0), m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && $(e, t, s, a, r, o);
				}
				vn(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: $(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						p !== m && (k = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: $(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && $(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: $(e, t, u, p, r, m);
				}
				return;
			default: if (wn(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && tp(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || tp(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || $(e, t, f, p, r, m);
	}
	function ap(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function op() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && ap(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && ap(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var sp = null, cp = null;
	function lp(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function up(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function dp(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function fp(e, t, n, r) {
		return n = lp(n).createElement(e), n[Mt] = r, n[Nt] = t, np(n, e, t), Kt(n), n;
	}
	function pp(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var mp = null;
	function hp() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== mp && (mp = e, !0) : (mp = null, !1);
	}
	var gp = typeof setTimeout == "function" ? setTimeout : void 0, _p = typeof clearTimeout == "function" ? clearTimeout : void 0, vp = typeof Promise == "function" ? Promise : void 0, yp = typeof requestAnimationFrame == "function" ? requestAnimationFrame : gp, bp = typeof queueMicrotask == "function" ? queueMicrotask : vp === void 0 ? gp : function(e) {
		return vp.resolve(null).then(e).catch(xp);
	};
	function xp(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Sp(e) {
		return e === "head";
	}
	function Cp(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$" || n === "/&") {
					if (r === 0) {
						e.removeChild(i), Hh(t);
						return;
					}
					r--;
				} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
				else if (n === "html") _m(e.ownerDocument.documentElement);
				else if (n === "head") {
					n = e.ownerDocument.head, _m(n);
					for (var a = n.firstChild; a;) {
						var o = a.nextSibling, s = a.nodeName;
						a[zt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
					}
				} else n === "body" && _m(e.ownerDocument.body);
			}
			n = i;
		} while (n);
		Hh(t);
	}
	function wp(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) {
				if (n = r.data, n === "/$") {
					if (e === 0) break;
					e--;
				} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			}
			n = r;
		} while (n);
	}
	function Tp(e, t, n) {
		if (t = CSS.escape(t) === t ? t : "r-" + btoa(t).replace(/=/g, ""), e.style.viewTransitionName = t, n != null && (e.style.viewTransitionClass = n), n = getComputedStyle(e), n.display === "inline") {
			if (t = e.getClientRects(), t.length === 1) var r = 1;
			else for (var i = r = 0; i < t.length; i++) {
				var a = t[i];
				0 < a.width && 0 < a.height && r++;
			}
			r === 1 && (e = e.style, e.display = t.length === 1 ? "inline-block" : "block", e.marginTop = "-" + n.paddingTop, e.marginBottom = "-" + n.paddingBottom);
		}
	}
	function Ep(e, t) {
		e = e.style, t = t.style;
		var n = t == null ? null : t.hasOwnProperty("viewTransitionName") ? t.viewTransitionName : t.hasOwnProperty("view-transition-name") ? t["view-transition-name"] : null;
		e.viewTransitionName = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), n = t == null ? null : t.hasOwnProperty("viewTransitionClass") ? t.viewTransitionClass : t.hasOwnProperty("view-transition-class") ? t["view-transition-class"] : null, e.viewTransitionClass = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), e.display === "inline-block" && (t == null ? e.display = e.margin = "" : (n = t.display, e.display = n == null || typeof n == "boolean" ? "" : n, n = t.margin, n == null ? (n = t.hasOwnProperty("marginTop") ? t.marginTop : t["margin-top"], e.marginTop = n == null || typeof n == "boolean" ? "" : n, t = t.hasOwnProperty("marginBottom") ? t.marginBottom : t["margin-bottom"], e.marginBottom = t == null || typeof t == "boolean" ? "" : t) : e.margin = n));
	}
	function Dp(e, t, n) {
		return n = n.ownerDocument.defaultView, {
			rect: e,
			abs: t.position === "absolute" || t.position === "fixed",
			clip: t.clipPath !== "none" || t.overflow !== "visible" || t.filter !== "none" || t.mask !== "none" || t.mask !== "none" || t.borderRadius !== "0px",
			view: 0 <= e.bottom && 0 <= e.right && e.top <= n.innerHeight && e.left <= n.innerWidth
		};
	}
	function Op(e) {
		return Dp(e.getBoundingClientRect(), getComputedStyle(e), e);
	}
	function kp(e) {
		var t = e.getBoundingClientRect();
		t = new DOMRect(t.x + 2e4, t.y + 2e4, t.width, t.height);
		var n = getComputedStyle(e);
		return Dp(t, n, e);
	}
	function Ap(e) {
		return e.documentElement.clientHeight;
	}
	function jp(e) {
		this.addEventListener("load", e), this.addEventListener("error", e);
	}
	function Mp(e, t, n, r, i, a, o, s, c) {
		var l = t.nodeType === 9 ? t : t.ownerDocument;
		try {
			var u = l.startViewTransition({
				update: function() {
					var t = l.defaultView, n = t.navigation && t.navigation.transition, o = l.fonts.status;
					r();
					var s = [];
					if (o === "loaded" && (Ap(l), l.fonts.status === "loading" && s.push(l.fonts.ready)), o = s.length, e !== null) for (var c = e.suspenseyImages, u = 0, d = 0; d < c.length; d++) {
						var f = c[d];
						if (!f.complete) {
							var p = f.getBoundingClientRect();
							if (0 < p.bottom && 0 < p.right && p.top < t.innerHeight && p.left < t.innerWidth) {
								if (u += Xm(f), u > $m) {
									s.length = o;
									break;
								}
								f = new Promise(jp.bind(f)), s.push(f);
							}
						}
					}
					if (0 < s.length) return t = Promise.race([Promise.all(s), new Promise(function(e) {
						return setTimeout(e, 500);
					})]).then(i, i), (n ? Promise.allSettled([n.finished, t]) : t).then(a, a);
					if (i(), n) return n.finished.then(a, a);
					a();
				},
				types: n
			});
			l.__reactViewTransition = u;
			var d = [];
			return u.ready.then(function() {
				for (var e = l.documentElement.getAnimations({ subtree: !0 }), t = 0; t < e.length; t++) {
					var n = e[t], r = n.effect, i = r.pseudoElement;
					if (i != null && i.startsWith("::view-transition")) {
						d.push(n), n = r.getKeyframes();
						for (var a = i = void 0, s = !0, c = 0; c < n.length; c++) {
							var u = n[c], f = u.width;
							if (i === void 0) i = f;
							else if (i !== f) {
								s = !1;
								break;
							}
							if (f = u.height, a === void 0) a = f;
							else if (a !== f) {
								s = !1;
								break;
							}
							delete u.width, delete u.height, u.transform === "none" && delete u.transform;
						}
						s && i !== void 0 && a !== void 0 && (r.setKeyframes(n), s = getComputedStyle(r.target, r.pseudoElement), s.width !== i || s.height !== a) && (s = n[0], s.width = i, s.height = a, s = n[n.length - 1], s.width = i, s.height = a, r.setKeyframes(n));
					}
				}
				o();
			}, function(e) {
				l.__reactViewTransition === u && (l.__reactViewTransition = null);
				try {
					if (typeof e == "object" && e) switch (e.name) {
						case "InvalidStateError": (e.message === "View transition was skipped because document visibility state is hidden." || e.message === "Skipping view transition because document visibility state has become hidden." || e.message === "Skipping view transition because viewport size changed." || e.message === "Transition was aborted because of invalid state") && (e = null);
					}
					e !== null && c(e);
				} finally {
					r(), i(), o();
				}
			}), u.finished.finally(function() {
				for (var e = 0; e < d.length; e++) d[e].cancel();
				l.__reactViewTransition === u && (l.__reactViewTransition = null), s();
			}), u;
		} catch {
			return r(), i(), o(), null;
		}
	}
	function Np(e, t) {
		this._scope = document.documentElement, this._selector = "::view-transition-" + e + "(" + t + ")";
	}
	Np.prototype.animate = function(e, t) {
		return t = typeof t == "number" ? { duration: t } : w({}, t), t.pseudoElement = this._selector, this._scope.animate(e, t);
	}, Np.prototype.getAnimations = function() {
		for (var e = this._scope, t = this._selector, n = e.getAnimations({ subtree: !0 }), r = [], i = 0; i < n.length; i++) {
			var a = n[i].effect;
			a !== null && a.target === e && a.pseudoElement === t && r.push(n[i]);
		}
		return r;
	}, Np.prototype.getComputedStyle = function() {
		return getComputedStyle(this._scope, this._selector);
	};
	function Pp(e) {
		return {
			name: e,
			group: new Np("group", e),
			imagePair: new Np("image-pair", e),
			old: new Np("old", e),
			new: new Np("new", e)
		};
	}
	function Fp(e) {
		this._fragmentFiber = e, this._observers = this._eventListeners = null;
	}
	Fp.prototype.addEventListener = function(e, t, n) {
		var r = null, i = null;
		if (!(n != null && typeof n != "boolean" && (r = n.signal || null, r !== null && r.aborted))) {
			this._eventListeners === null && (this._eventListeners = []);
			var a = this._eventListeners;
			if (Bp(a, e, t, n) === -1) {
				var o = this, s = t;
				n != null && typeof n != "boolean" && !0 === n.once && (s = function(r) {
					o.removeEventListener(e, t, n), typeof t == "function" ? t.call(this, r) : t.handleEvent(r);
				}), r !== null && (i = o.removeEventListener.bind(o, e, t, n), r.addEventListener("abort", i, { once: !0 }), i = r.removeEventListener.bind(r, "abort", i)), r = Rp(n), a.push({
					type: e,
					listener: t,
					optionsOrUseCapture: n,
					attachedListener: s,
					cleanup: i
				}), h(this._fragmentFiber.child, !1, Ip, e, s, r);
			}
			this._eventListeners = a;
		}
	};
	function Ip(e, t, n, r) {
		return b(e).addEventListener(t, n, r), !1;
	}
	Fp.prototype.removeEventListener = function(e, t, n) {
		var r = this._eventListeners;
		if (r !== null && (t = Bp(r, e, t, n), t !== -1)) {
			var i = r[t];
			n = i.attachedListener;
			var a = i.cleanup;
			i = Rp(i.optionsOrUseCapture), h(this._fragmentFiber.child, !1, Lp, e, n, i), r.splice(t, 1), a !== null && a();
		}
	};
	function Lp(e, t, n, r) {
		return b(e).removeEventListener(t, n, r), !1;
	}
	function Rp(e) {
		return e != null && typeof e != "boolean" && (!0 === e.once || e.signal instanceof AbortSignal) ? {
			capture: e.capture,
			passive: e.passive
		} : e;
	}
	function zp(e) {
		return e == null ? "c=0" : typeof e == "boolean" ? "c=" + (e ? "1" : "0") : "c=" + (e.capture ? "1" : "0");
	}
	function Bp(e, t, n, r) {
		if (e.length === 0) return -1;
		r = zp(r);
		for (var i = 0; i < e.length; i++) {
			var a = e[i];
			if (a.type === t && a.listener === n && zp(a.optionsOrUseCapture) === r) return i;
		}
		return -1;
	}
	Fp.prototype.dispatchEvent = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return !0;
		t = b(t);
		var n = this._eventListeners;
		if (n !== null && 0 < n.length || !e.bubbles) {
			var r = t.nodeType === 9 ? t.createComment("") : document.createTextNode("");
			if (n) for (var i = 0; i < n.length; i++) {
				var a = n[i];
				r.addEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			}
			if (t.appendChild(r), e = r.dispatchEvent(e), n) for (i = 0; i < n.length; i++) a = n[i], r.removeEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			return t.removeChild(r), e;
		}
		return t.dispatchEvent(e);
	}, Fp.prototype.focus = function(e) {
		h(this._fragmentFiber.child, !0, Vp, e, void 0, void 0);
	};
	function Vp(e, t) {
		return e.tag !== 6 && (e = b(e), pm(e, t));
	}
	Fp.prototype.focusLast = function(e) {
		var t = [];
		h(this._fragmentFiber.child, !0, Hp, t, void 0, void 0);
		for (var n = t.length - 1; 0 <= n && !Vp(t[n], e); n--);
	};
	function Hp(e, t) {
		return t.push(e), !1;
	}
	Fp.prototype.blur = function() {
		var e = g(this._fragmentFiber);
		e !== null && (e = b(e), e = lp(e).activeElement, e !== null && h(this._fragmentFiber.child, !1, Up, e, void 0, void 0));
	};
	function Up(e, t) {
		return e.tag !== 6 && (e = b(e), e === t || e.contains(t) ? (t.blur(), !0) : !1);
	}
	Fp.prototype.observeUsing = function(e) {
		this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(e), h(this._fragmentFiber.child, !1, Wp, e, void 0, void 0);
	};
	function Wp(e, t) {
		return e.tag !== 6 && (e = b(e), t.observe(e), !1);
	}
	Fp.prototype.unobserveUsing = function(e) {
		var t = this._observers;
		if (t !== null && t.has(e)) {
			t.delete(e), h(this._fragmentFiber.child, !1, Gp, e, void 0, void 0);
			for (var n = t = 0; n < Kp.length; n++) {
				var r = Kp[n];
				r.fragmentInstance === this && r.observer === e ? e.unobserve(r.instance) : Kp[t++] = r;
			}
			Kp.length = t;
		}
	};
	function Gp(e, t) {
		return e.tag !== 6 && (e = b(e), t.unobserve(e), !1);
	}
	var Kp = [], qp = !1;
	function Jp(e, t, n) {
		Kp.push({
			fragmentInstance: e,
			observer: t,
			instance: n
		}), qp || (qp = !0, mm(function() {
			qp = !1;
			var e = Kp;
			Kp = [];
			for (var t = 0; t < e.length; t++) {
				var n = e[t];
				n.observer.unobserve(n.instance);
			}
		}));
	}
	Fp.prototype.getClientRects = function() {
		var e = [];
		return h(this._fragmentFiber.child, !1, Yp, e, void 0, void 0), e;
	};
	function Yp(e, t) {
		if (e.tag === 6) {
			e = e.stateNode;
			var n = e.ownerDocument.createRange();
			n.selectNodeContents(e), t.push.apply(t, n.getClientRects());
		} else e = b(e), t.push.apply(t, e.getClientRects());
		return !1;
	}
	Fp.prototype.getRootNode = function(e) {
		var t = g(this._fragmentFiber);
		return t === null ? this : b(t).getRootNode(e);
	}, Fp.prototype.compareDocumentPosition = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		var n = [];
		h(this._fragmentFiber.child, !1, Hp, n, void 0, void 0);
		var r = b(t);
		if (n.length === 0) {
			if (n = r, _(this._fragmentFiber)) {
				a: {
					for (t = this._fragmentFiber.return; t !== null;) {
						if (t.tag === 4) {
							t = t.stateNode.containerInfo;
							break a;
						}
						if (t.tag === 3 || t.tag === 5 || t.tag === 27) break;
						t = t.return;
					}
					t = null;
				}
				t != null && (n = t);
			}
			t = this._fragmentFiber;
			var i = r = n.compareDocumentPosition(e);
			return n === e ? i = Node.DOCUMENT_POSITION_CONTAINS : r & Node.DOCUMENT_POSITION_CONTAINED_BY && (n = v(t)[1], n === null ? i = Node.DOCUMENT_POSITION_PRECEDING : (e = b(n).compareDocumentPosition(e), i = e === 0 || e & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), i |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
		}
		t = b(n[0]), i = b(n[n.length - 1]);
		var a = _(this._fragmentFiber) ? t.parentElement : r;
		if (a == null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		r = a.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_CONTAINED_BY, a = a.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_CONTAINED_BY;
		var o = t.compareDocumentPosition(e), s = i.compareDocumentPosition(e), c = o & Node.DOCUMENT_POSITION_CONTAINED_BY || s & Node.DOCUMENT_POSITION_CONTAINED_BY;
		return s = r && a && o & Node.DOCUMENT_POSITION_FOLLOWING && s & Node.DOCUMENT_POSITION_PRECEDING, t = r && t === e || a && i === e || c || s ? Node.DOCUMENT_POSITION_CONTAINED_BY : !r && t === e || !a && i === e ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : o, t & Node.DOCUMENT_POSITION_DISCONNECTED || t & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || Xp(t, this._fragmentFiber, n[0], n[n.length - 1], e) ? t : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
	};
	function Xp(e, t, n, r, i) {
		var a = Ht(i);
		if (e & Node.DOCUMENT_POSITION_CONTAINED_BY) {
			if (n = !!a) a: {
				for (; a !== null;) {
					if (a.tag === 7 && (a === t || a.alternate === t)) {
						n = !0;
						break a;
					}
					a = a.return;
				}
				n = !1;
			}
			return n;
		}
		if (e & Node.DOCUMENT_POSITION_CONTAINS) {
			if (a === null) return a = i.ownerDocument, i === a || i === a.documentElement || i === a.body;
			a: {
				for (a = t, t = g(t); a !== null;) {
					if (!(a.tag !== 5 && a.tag !== 3 && a.tag !== 27 || a !== t && a.alternate !== t)) {
						a = !0;
						break a;
					}
					a = a.return;
				}
				a = !1;
			}
			return a;
		}
		return e & Node.DOCUMENT_POSITION_PRECEDING ? ((t = !!a) && !(t = a === n) && (t = ne(n, a, C), t === null ? t = !1 : (h(t, !0, x, a, n), a = ee, ee = null, t = a !== null)), t) : e & Node.DOCUMENT_POSITION_FOLLOWING ? ((t = !!a) && !(t = a === r) && (t = ne(r, a, C), t === null ? t = !1 : (h(t, !0, S, a, r), a = ee, te = ee = null, t = a !== null)), t) : !1;
	}
	function Zp(e, t) {
		var n = e.ownerDocument.createRange();
		n.selectNodeContents(e), e = n.getBoundingClientRect(), window.scrollTo(window.scrollX + e.left, t ? window.scrollY + e.top : window.scrollY + e.bottom - window.innerHeight);
	}
	Fp.prototype.scrollIntoView = function(e) {
		if (typeof e == "object") throw Error(i(566));
		var t = [];
		h(this._fragmentFiber.child, !1, Hp, t, void 0, void 0);
		var n = !1 !== e;
		if (t.length === 0) {
			var r = v(this._fragmentFiber);
			if (r = n ? r[1] || r[0] || g(this._fragmentFiber) : r[0] || r[1], r === null) return;
			if (r.tag === 6) {
				e = b(r), Zp(e, n);
				return;
			}
			if (r = b(r), r.nodeType !== 9) {
				if (r.nodeType === 11) {
					n = "host" in r ? r.host : null, n !== null && n.scrollIntoView(e);
					return;
				}
				r.scrollIntoView(e);
			}
		}
		for (r = n ? t.length - 1 : 0; r !== (n ? -1 : t.length);) {
			var a = t[r];
			a.tag === 6 ? (a = b(a), Zp(a, n)) : b(a).scrollIntoView(e), r += n ? -1 : 1;
		}
	};
	function Qp(e, t) {
		return e = b(e), $p(e, t), !1;
	}
	function $p(e, t) {
		e.reactFragments ??= /* @__PURE__ */ new Set(), e.reactFragments.add(t);
	}
	function em(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.addEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			for (var r = 0, i = 0; i < Kp.length; i++) {
				var a = Kp[i];
				(a.fragmentInstance !== t || a.observer !== n || a.instance !== e) && (Kp[r++] = a);
			}
			Kp.length = r, n.observe(e);
		}), $p(e, t));
	}
	function tm(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.removeEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			typeof n.rootMargin == "string" ? Jp(t, n, e) : n.unobserve(e);
		}), e.reactFragments != null && e.reactFragments.delete(t));
	}
	function nm(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					nm(n), Vt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function rm(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) {
				if (t === "input" && e.type === "hidden") {
					var a = i.name == null ? null : "" + i.name;
					if (i.type === "hidden" && e.getAttribute("name") === a) return e;
				} else return e;
			} else if (!e[zt]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = lm(e.nextSibling), e === null) break;
		}
		return null;
	}
	function im(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function am(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function om(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function sm(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function cm(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function lm(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var um = null;
	function dm(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return lm(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function fm(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function pm(e, t) {
		function n() {
			r = !0;
		}
		if (e.ownerDocument.activeElement === e) return !0;
		var r = !1;
		try {
			e.ownerDocument.addEventListener("focus", n, !0), (e.focus || HTMLElement.prototype.focus).call(e, t);
		} finally {
			e.ownerDocument.removeEventListener("focus", n, !0);
		}
		return r;
	}
	function mm(e) {
		yp(function() {
			yp(function(t) {
				return e(t);
			});
		});
	}
	function hm(e, t, n) {
		switch (t = lp(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function gm(e, t, n) {
		for (var r in n) {
			var i = n[r];
			n.hasOwnProperty(r) && i != null && $(e, t, r, null, rp, i);
		}
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === On && (e.onclick = null), Vt(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		Vt(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = E.d;
	E.d = {
		f: Sm,
		r: Cm,
		D: Em,
		C: Dm,
		L: Om,
		m: km,
		X: jm,
		S: Am,
		M: Mm
	};
	function Sm() {
		var e = xm.f(), t = zd();
		return e || t;
	}
	function Cm(e) {
		var t = Ut(e);
		t !== null && t.tag === 5 && t.type === "form" ? oc(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = pn(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), Kt(t), r.head.appendChild(t)));
		}
	}
	function Em(e) {
		xm.D(e), Tm("dns-prefetch", e, null);
	}
	function Dm(e, t) {
		xm.C(e, t), Tm("preconnect", e, t);
	}
	function Om(e, t, n) {
		xm.L(e, t, n);
		var r = wm;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + pn(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + pn(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + pn(n.imageSizes) + "\"]")) : i += "[href=\"" + pn(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Pm(e);
					break;
				case "script": a = Rm(e);
			}
			if (!(vm.has(a) || (e = w({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), vm.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(Fm(a)) || t === "script" && r.querySelector(zm(a))))) {
				var o = r.createElement("link");
				np(o, "link", e), t === "style" && (o[Bt] = !0, o.onload = o.onerror = function() {
					qt(o);
				}), Kt(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + pn(r) + "\"][href=\"" + pn(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Rm(e);
			}
			if (!vm.has(a) && (e = w({
				rel: "modulepreload",
				href: e
			}, t), vm.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(zm(a))) return;
				}
				r = n.createElement("link"), np(r, "link", e), Kt(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = Gt(r).hoistableStyles, a = Pm(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(Fm(a))) s.loading = 5;
				else {
					e = w({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = vm.get(a)) && Hm(e, n);
					var c = o = r.createElement("link");
					Kt(c), np(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Vm(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function jm(e, t) {
		xm.X(e, t);
		var n = wm;
		if (n && e) {
			var r = Gt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = w({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Kt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Mm(e, t) {
		xm.M(e, t);
		var n = wm;
		if (n && e) {
			var r = Gt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = w({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Kt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var a = (a = Me.current) ? bm(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = Gt(a).hoistableStyles, r = t.get(n), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Pm(n.href);
					var o = Gt(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(Fm(e))) ? o._p || (s.instance = o, s.state.loading = 5) : (o = vm.get(e), o || (o = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, vm.set(e, o)), Lm(a, e, o, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = Gt(a).hoistableScripts, r = t.get(n), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Pm(e) {
		return "href=\"" + pn(e) + "\"";
	}
	function Fm(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Im(e) {
		return w({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Lm(e, t, n, r) {
		if (t = e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]")) {
			if (!0 !== t[Bt]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[Bt] = !0, t.onload = t.onerror = qt.bind(null, t), np(t, "link", n), Kt(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + pn(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + pn(n.href) + "\"]");
				if (r) return t.instance = r, Kt(r), r;
				var a = w({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Kt(r), np(r, "style", a), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Pm(n.href);
				var o = e.querySelector(Fm(a));
				if (o) return t.state.loading |= 4, t.instance = o, Kt(o), o;
				r = Im(n), (a = vm.get(a)) && Hm(r, a), o = (e.ownerDocument || e).createElement("link"), Kt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), np(o, "link", r), t.state.loading |= 4, Vm(o, n.precedence, e), t.instance = o;
			case "script": return o = Rm(n.src), (a = e.querySelector(zm(o))) ? (t.instance = a, Kt(a), a) : (r = n, (a = vm.get(o)) && (r = w({}, n), Um(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), Kt(a), np(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Vm(r, n.precedence, e));
		return t.instance;
	}
	function Vm(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Hm(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function Um(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Wm = null;
	function Gm(e, t, n) {
		if (Wm === null) {
			var r = /* @__PURE__ */ new Map(), i = Wm = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Wm, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[zt] || a[Mt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Km(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function qm(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Jm(e, t) {
		return e === "img" && t.src != null && t.src !== "" && t.onLoad == null && t.loading !== "lazy";
	}
	function Ym(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Xm(e) {
		return (e.width || 100) * (e.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * .25;
	}
	function Zm(e, t) {
		typeof t.decode == "function" && (e.imgCount++, t.complete || (e.imgBytes += Xm(t), e.suspenseyImages.push(t)), e = rh.bind(e), t.decode().then(e, e));
	}
	function Qm(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Pm(r.href), a = t.querySelector(Fm(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Kt(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), Kt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), np(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = nh.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var $m = 0;
	function eh(e, t) {
		return e.stylesheets && e.count === 0 && ah(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && ah(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && $m === 0 && ($m = 62500 * op());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && ah(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > $m ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function th(e) {
		if (e.count === 0 && (e.imgCount === 0 || !e.waitingForImages)) {
			if (e.stylesheets) ah(e, e.stylesheets);
			else if (e.unsuspend) {
				var t = e.unsuspend;
				e.unsuspend = null, t();
			}
		}
	}
	function nh() {
		this.count--, th(this);
	}
	function rh() {
		this.imgCount--, th(this);
	}
	var ih = null;
	function ah(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, ih = /* @__PURE__ */ new Map(), t.forEach(oh, e), ih = null, nh.call(e));
	}
	function oh(e, t) {
		if (!(t.state.loading & 4)) {
			var n = ih.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), ih.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = nh.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var sh = {
		$$typeof: ue,
		Provider: null,
		Consumer: null,
		_currentValue: Ee,
		_currentValue2: Ee,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = xt(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = xt(0), this.hiddenUpdates = xt(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = zi(3, null, null, t), e.current = a, a.stateNode = e, t = Fa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, vo(a), e;
	}
	function uh(e) {
		return e ? (e = Li, e) : Li;
	}
	function dh(e, t, n, r, i, a) {
		i = uh(i), r.context === null ? r.context = i : r.pendingContext = i, r = bo(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = xo(e, r, t), n !== null && (Pd(n, e, t), So(n, e, t));
	}
	function fh(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ph(e, t) {
		fh(e, t), (e = e.alternate) && fh(e, t);
	}
	function mh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = Pi(e, 67108864);
			t !== null && Pd(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = jd();
			t = Dt(t);
			var n = Pi(e, t);
			n !== null && Pd(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = T.T;
		T.T = null;
		var a = E.p;
		try {
			E.p = 2, yh(e, t, n, r);
		} finally {
			E.p = a, T.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = T.T;
		T.T = null;
		var a = E.p;
		try {
			E.p = 8, yh(e, t, n, r);
		} finally {
			E.p = a, T.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) Kf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = Ut(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = ht(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - ct(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Ef(a), !(W & 6) && (gd = Xe() + 500, Df(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = Pi(a, 2), s !== null && Pd(s, a, 2), zd(), ph(a, 2);
					}
					if (a = bh(r), a === null && Kf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Kf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = An(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = Ht(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return xh = e, null;
	}
	function Ch(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "fullscreenerror":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "resize":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (Ze()) {
				case Qe: return 2;
				case $e: return 8;
				case et:
				case tt: return 32;
				case nt: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var wh = !1, Th = null, Eh = null, Dh = null, Oh = /* @__PURE__ */ new Map(), kh = /* @__PURE__ */ new Map(), Ah = [], jh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Mh(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Th = null;
				break;
			case "dragenter":
			case "dragleave":
				Eh = null;
				break;
			case "mouseover":
			case "mouseout":
				Dh = null;
				break;
			case "pointerover":
			case "pointerout":
				Oh.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": kh.delete(t.pointerId);
		}
	}
	function Nh(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Ut(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Ph(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Th = Nh(Th, e, t, n, r, i), !0;
			case "dragenter": return Eh = Nh(Eh, e, t, n, r, i), !0;
			case "mouseover": return Dh = Nh(Dh, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Oh.set(a, Nh(Oh.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, kh.set(a, Nh(kh.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Fh(e) {
		var t = Ht(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, At(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, At(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Ih(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = bh(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				kn = r, n.target.dispatchEvent(r), kn = null;
			} else return t = Ut(n), t !== null && mh(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Lh(e, t, n) {
		Ih(e) && n.delete(t);
	}
	function Rh() {
		wh = !1, Th !== null && Ih(Th) && (Th = null), Eh !== null && Ih(Eh) && (Eh = null), Dh !== null && Ih(Dh) && (Dh = null), Oh.forEach(Lh), kh.forEach(Lh);
	}
	function zh(e, n) {
		e.blockedOn === n && (e.blockedOn = null, wh || (wh = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, Rh)));
	}
	var Bh = null;
	function Vh(e) {
		Bh !== e && (Bh = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			Bh === e && (Bh = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (Sh(r || n) === null) continue;
					break;
				}
				var a = Ut(n);
				a !== null && (e.splice(t, 3), t -= 3, ic(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Hh(e) {
		function t(t) {
			return zh(t, e);
		}
		Th !== null && zh(Th, e), Eh !== null && zh(Eh, e), Dh !== null && zh(Dh, e), Oh.forEach(t), kh.forEach(t);
		for (var n = 0; n < Ah.length; n++) {
			var r = Ah[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < Ah.length && (n = Ah[0], n.blockedOn === null);) Fh(n), n.blockedOn === null && Ah.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[Nt] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[Nt] || null) s = o.formAction;
					else if (Sh(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Vh(n);
			}
		}
	}
	function Uh() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Wh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.render = Wh.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		dh(n, jd(), e, t, null, null);
	}, Gh.prototype.unmount = Wh.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			dh(e.current, 2, null, e, null, null), zd(), t[Pt] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = kt();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Ah.length && t !== 0 && t < Ah[n].priority; n++);
			Ah.splice(n, 0, e), n === 0 && Fh(e);
		}
	};
	var Kh = n.version;
	if (Kh !== "19.3.0") throw Error(i(527, Kh, "19.3.0"));
	E.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var qh = {
		bundleType: 0,
		version: "19.3.0",
		rendererPackageName: "react-dom",
		currentDispatcherRef: T,
		reconcilerVersion: "19.3.0"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Jh = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Jh.isDisabled && Jh.supportsFiber) try {
			at = Jh.inject(qh), ot = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Dc, s = Oc, c = kc;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, o, s, c, Uh), e[Pt] = t.current, Wf(e), new Wh(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(u(), 1), v = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i, y = /^[\\/]{2}/;
function b(e, t) {
	return t + e.replace(/\\/g, "/");
}
function ee(e) {
	return typeof e == "object" && !!e && "pathname" in e && "search" in e && "hash" in e && "state" in e && "key" in e;
}
function te(e = {}) {
	let { initialEntries: t = ["/"], initialIndex: n, v5Compat: r = !1 } = e, i;
	i = t.map((e, t) => u(e, typeof e == "string" ? null : e.state, t === 0 ? "default" : void 0, typeof e == "string" ? void 0 : e.mask));
	let a = c(n ?? i.length - 1), o = "POP", s = null;
	function c(e) {
		return Math.min(Math.max(e, 0), i.length - 1);
	}
	function l() {
		return i[a];
	}
	function u(e, t = null, n, r) {
		let a = ne(i ? l().pathname : "/", e, t, n, r);
		return S(a.pathname.charAt(0) === "/", `relative pathnames are not supported in memory history: ${JSON.stringify(e)}`), a;
	}
	function d(e) {
		return typeof e == "string" ? e : w(e);
	}
	return {
		get index() {
			return a;
		},
		get action() {
			return o;
		},
		get location() {
			return l();
		},
		createHref: d,
		createURL(e) {
			return new URL(d(e), "http://localhost");
		},
		encodeLocation(e) {
			let t = typeof e == "string" ? re(e) : e;
			return {
				pathname: t.pathname || "",
				search: t.search || "",
				hash: t.hash || ""
			};
		},
		push(e, t) {
			o = "PUSH";
			let n = ee(e) ? e : u(e, t);
			a += 1, i.splice(a, i.length, n), r && s && s({
				action: o,
				location: n,
				delta: 1
			});
		},
		replace(e, t) {
			o = "REPLACE";
			let n = ee(e) ? e : u(e, t);
			i[a] = n, r && s && s({
				action: o,
				location: n,
				delta: 0
			});
		},
		go(e) {
			o = "POP";
			let t = c(a + e), n = i[t];
			a = t, s && s({
				action: o,
				location: n,
				delta: e
			});
		},
		listen(e) {
			return s = e, () => {
				s = null;
			};
		}
	};
}
function x(e, t) {
	if (e === !1 || e == null) throw Error(t);
}
function S(e, t) {
	if (!e) {
		typeof console < "u" && console.warn(t);
		try {
			throw Error(t);
		} catch {}
	}
}
function C() {
	return Math.random().toString(36).substring(2, 10);
}
function ne(e, t, n = null, r, i) {
	return {
		pathname: typeof e == "string" ? e : e.pathname,
		search: "",
		hash: "",
		...typeof t == "string" ? re(t) : t,
		state: n,
		key: t && t.key || r || C(),
		mask: i
	};
}
function w({ pathname: e = "/", search: t = "", hash: n = "" }) {
	return t && t !== "?" && (e += t.charAt(0) === "?" ? t : "?" + t), n && n !== "#" && (e += n.charAt(0) === "#" ? n : "#" + n), e;
}
function re(e) {
	let t = {};
	if (e) {
		let n = e.indexOf("#");
		n >= 0 && (t.hash = e.substring(n), e = e.substring(0, n));
		let r = e.indexOf("?");
		r >= 0 && (t.search = e.substring(r), e = e.substring(0, r)), e && (t.pathname = e);
	}
	return t;
}
function ie(e, t, n = "/") {
	return ae(e, t, n, !1);
}
function ae(e, t, n, r, i) {
	let a = we((typeof t == "string" ? re(t) : t).pathname || "/", n);
	if (a == null) return null;
	let o = i ?? oe(e), s = null, c = Ce(a);
	for (let e = 0; s == null && e < o.length; ++e) s = ye(o[e], c, r);
	return s;
}
function oe(e) {
	let t = se(e);
	return le(t), t;
}
function se(e, t = [], n = [], r = "", i = !1) {
	let a = (e, a, o = i, s) => {
		let c = {
			relativePath: s === void 0 ? e.path || "" : s,
			caseSensitive: e.caseSensitive === !0,
			childrenIndex: a,
			route: e
		};
		if (c.relativePath.startsWith("/")) {
			if (!c.relativePath.startsWith(r) && o) return;
			x(c.relativePath.startsWith(r), `Absolute route path "${c.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`), c.relativePath = c.relativePath.slice(r.length);
		}
		let l = D([r, c.relativePath]), u = n.concat(c);
		e.children && e.children.length > 0 && (x(e.index !== !0, `Index routes must not have child routes. Please remove all child routes from route path "${l}".`), se(e.children, t, u, l, o)), (e.path != null || e.index) && t.push({
			path: l,
			score: _e(l, e.index),
			routesMeta: u.map((e, t) => {
				let [n, r] = Se(e.relativePath, e.caseSensitive, t === u.length - 1);
				return {
					...e,
					matcher: n,
					compiledParams: r
				};
			})
		});
	};
	return e.forEach((e, t) => {
		if (e.path === "" || !e.path?.includes("?")) a(e, t);
		else for (let n of ce(e.path)) a(e, t, !0, n);
	}), t;
}
function ce(e) {
	let t = e.split("/");
	if (t.length === 0) return [];
	let [n, ...r] = t, i = n.endsWith("?"), a = n.replace(/\?$/, "");
	if (r.length === 0) return i ? [a, ""] : [a];
	let o = ce(r.join("/")), s = [];
	return s.push(...o.map((e) => e === "" ? a : [a, e].join("/"))), i && s.push(...o), s.map((t) => e.startsWith("/") && t === "" ? "/" : t);
}
function le(e) {
	e.sort((e, t) => e.score === t.score ? ve(e.routesMeta.map((e) => e.childrenIndex), t.routesMeta.map((e) => e.childrenIndex)) : t.score - e.score);
}
var ue = /^:[\w-]+$/, de = 3, fe = 2, pe = 1, me = 10, he = -2, ge = (e) => e === "*";
function _e(e, t) {
	let n = e.split("/"), r = n.length;
	return n.some(ge) && (r += he), t && (r += fe), n.filter((e) => !ge(e)).reduce((e, t) => e + (ue.test(t) ? de : t === "" ? pe : me), r);
}
function ve(e, t) {
	return e.length === t.length && e.slice(0, -1).every((e, n) => e === t[n]) ? e[e.length - 1] - t[t.length - 1] : 0;
}
function ye(e, t, n = !1) {
	let { routesMeta: r } = e, i = {}, a = "/", o = [];
	for (let e = 0; e < r.length; ++e) {
		let s = r[e], c = e === r.length - 1, l = a === "/" ? t : t.slice(a.length) || "/", u = {
			path: s.relativePath,
			caseSensitive: s.caseSensitive,
			end: c
		}, d = s.matcher && s.compiledParams ? xe(u, l, s.matcher, s.compiledParams) : be(u, l), f = s.route;
		if (!d && c && n && !r[r.length - 1].route.index && (d = be({
			path: s.relativePath,
			caseSensitive: s.caseSensitive,
			end: !1
		}, l)), !d) return null;
		Object.assign(i, d.params), o.push({
			params: i,
			pathname: D([a, d.pathname]),
			pathnameBase: Ae(D([a, d.pathnameBase])),
			route: f
		}), d.pathnameBase !== "/" && (a = D([a, d.pathnameBase]));
	}
	return o;
}
function be(e, t) {
	typeof e == "string" && (e = {
		path: e,
		caseSensitive: !1,
		end: !0
	});
	let [n, r] = Se(e.path, e.caseSensitive, e.end);
	return xe(e, t, n, r);
}
function xe(e, t, n, r) {
	let i = t.match(n);
	if (!i) return null;
	let a = i[0], o = O(a, 1), s = i.slice(1);
	return {
		params: r.reduce((e, { paramName: t, isOptional: n }, r) => {
			if (t === "*") {
				let e = s[r] || "";
				o = O(a.slice(0, a.length - e.length), 1);
			}
			let i = s[r];
			return e[t] = n && !i ? void 0 : (i || "").replace(/%2F/g, "/"), e;
		}, {}),
		pathname: a,
		pathnameBase: o,
		pattern: e
	};
}
function Se(e, t = !1, n = !0) {
	S(e === "*" || !e.endsWith("*") || e.endsWith("/*"), `Route path "${e}" will be treated as if it were "${e.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/, "/*")}".`);
	let r = [], i = "^" + e.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (e, t, n, i, a) => {
		if (r.push({
			paramName: t,
			isOptional: n != null
		}), n) {
			let t = a.charAt(i + e.length);
			return t && t !== "/" ? "/([^\\/]*)" : "(?:/([^\\/]*))?";
		}
		return "/([^\\/]+)";
	}).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
	return e.endsWith("*") ? (r.push({ paramName: "*" }), i += e === "*" || e === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : n ? i += "\\/*$" : e !== "" && e !== "/" && (i += "(?:(?=\\/|$))"), [new RegExp(i, t ? void 0 : "i"), r];
}
function Ce(e) {
	try {
		return e.split("/").map((e) => decodeURIComponent(e).replace(/\//g, "%2F")).join("/");
	} catch (t) {
		return S(!1, `The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`), e;
	}
}
function we(e, t) {
	if (t === "/") return e;
	if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
	let n = t.endsWith("/") ? t.length - 1 : t.length, r = e.charAt(n);
	return r && r !== "/" ? null : e.slice(n) || "/";
}
function Te(e, t = "/") {
	let { pathname: n, search: r = "", hash: i = "" } = typeof e == "string" ? re(e) : e, a;
	return n ? (n = ke(n), a = n.startsWith("/") || n.startsWith("\\") ? T(n.substring(1), "/") : T(n, t)) : a = t, {
		pathname: a,
		search: je(r),
		hash: Me(i)
	};
}
function T(e, t) {
	let n = O(t).split("/");
	return e.split("/").forEach((e) => {
		e === ".." ? n.length > 1 && n.pop() : e !== "." && n.push(e);
	}), n.length > 1 ? n.join("/") : "/";
}
function E(e, t, n, r) {
	return `Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function Ee(e) {
	return e.filter((e, t) => t === 0 || e.route.path && e.route.path.length > 0);
}
function De(e) {
	let t = Ee(e);
	return t.map((e, n) => n === t.length - 1 ? e.pathname : e.pathnameBase);
}
function Oe(e, t, n, r = !1) {
	let i;
	typeof e == "string" ? i = re(e) : (i = { ...e }, x(!i.pathname || !i.pathname.includes("?"), E("?", "pathname", "search", i)), x(!i.pathname || !i.pathname.includes("#"), E("#", "pathname", "hash", i)), x(!i.search || !i.search.includes("#"), E("#", "search", "hash", i)));
	let a = e === "" || i.pathname === "", o = a ? "/" : i.pathname, s;
	if (o == null) s = n;
	else {
		let e = t.length - 1;
		if (!r && o.startsWith("..")) {
			let t = o.split("/");
			for (; t[0] === "..";) t.shift(), --e;
			i.pathname = t.join("/");
		}
		s = e >= 0 ? t[e] : "/";
	}
	let c = Te(i, s), l = o && o !== "/" && o.endsWith("/"), u = (a || o === ".") && n.endsWith("/");
	return !c.pathname.endsWith("/") && (l || u) && (c.pathname += "/"), c;
}
var ke = (e) => e.replace(/[\\/]{2,}/g, "/"), D = (e) => ke(e.join("/"));
function O(e, t = 0) {
	let n = e.length;
	for (; n > t && e.charCodeAt(n - 1) === 47;) n--;
	return n === e.length ? e : e.slice(0, n);
}
var Ae = (e) => O(e).replace(/^\/*/, "/"), je = (e) => !e || e === "?" ? "" : e.startsWith("?") ? e : "?" + e, Me = (e) => !e || e === "#" ? "" : e.startsWith("#") ? e : "#" + e, Ne = class {
	constructor(e, t, n, r = !1) {
		this.status = e, this.statusText = t || "", this.internal = r, n instanceof Error ? (this.data = n.toString(), this.error = n) : this.data = n;
	}
};
function Pe(e) {
	return e != null && typeof e.status == "number" && typeof e.statusText == "string" && typeof e.internal == "boolean" && "data" in e;
}
function Fe(e) {
	return D(e.map((e) => e.route.path).filter(Boolean)) || "/";
}
var Ie = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0;
function Le(e, t) {
	let n = e;
	if (typeof n != "string" || !v.test(n)) return {
		absoluteURL: void 0,
		isExternal: !1,
		to: n
	};
	let r = n, i = !1;
	if (Ie) try {
		let e = new URL(window.location.href), r = y.test(n) ? new URL(b(n, e.protocol)) : new URL(n), a = we(r.pathname, t);
		r.origin === e.origin && a != null ? n = a + r.search + r.hash : i = !0;
	} catch {
		S(!1, `<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`);
	}
	return {
		absoluteURL: r,
		isExternal: i,
		to: n
	};
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var Re = new URL("http://localhost");
function ze(e) {
	if (e.createURL) return e.createURL("/");
	try {
		return new URL(e.createHref("/"), Re);
	} catch {
		return Re;
	}
}
function Be(e, t) {
	return e.origin === t.origin && (e.origin !== "null" || e.protocol === t.protocol && e.host === t.host);
}
function Ve(e, t) {
	if (e.startsWith("//")) return !0;
	let n = t.protocol.toLowerCase();
	return e.toLowerCase().startsWith(n) ? t.host === "" || e.slice(n.length).startsWith("//") : !1;
}
function He(e, t, n, r) {
	let i = null;
	try {
		i = e == null ? null : new URL(e, n);
	} catch {}
	let a = new URL(t, n), o = i != null && !Be(i, n), s = !Be(a, n);
	if (r === "reject") {
		if (o || s) throw Error("External navigation is not allowed");
	} else if (s && (i == null || !Ve(e, i) || !Be(i, a))) throw Error("External navigation is not allowed");
}
var Ue = [
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
];
new Set(Ue);
var We = ["GET", ...Ue];
new Set(We);
var Ge = [
	"about:",
	"blob:",
	"chrome:",
	"chrome-untrusted:",
	"content:",
	"data:",
	"devtools:",
	"file:",
	"filesystem:",
	"javascript:"
];
function Ke(e) {
	try {
		return Ge.includes(new URL(e).protocol);
	} catch {
		return !1;
	}
}
var qe = _.createContext(null);
qe.displayName = "DataRouter";
var Je = _.createContext(null);
Je.displayName = "DataRouterState";
var Ye = _.createContext(!1);
function Xe() {
	return _.useContext(Ye);
}
var Ze = _.createContext({ isTransitioning: !1 });
Ze.displayName = "ViewTransition";
var Qe = _.createContext(/* @__PURE__ */ new Map());
Qe.displayName = "Fetchers";
var $e = _.createContext(null);
$e.displayName = "Await";
var et = _.createContext(null);
et.displayName = "Navigation";
var tt = _.createContext(null);
tt.displayName = "Location";
var nt = _.createContext({
	outlet: null,
	matches: [],
	isDataRoute: !1
});
nt.displayName = "Route";
var rt = _.createContext(null);
rt.displayName = "RouteError";
var it = "REACT_ROUTER_ERROR", at = "REDIRECT", ot = "ROUTE_ERROR_RESPONSE";
function st(e) {
	if (e.startsWith(`${it}:${at}:{`)) try {
		let t = JSON.parse(e.slice(28));
		if (typeof t == "object" && t && typeof t.status == "number" && typeof t.statusText == "string" && typeof t.location == "string" && typeof t.reloadDocument == "boolean" && typeof t.replace == "boolean") return t;
	} catch {}
}
function ct(e) {
	if (e.startsWith(`${it}:${ot}:{`)) try {
		let t = JSON.parse(e.slice(40));
		if (typeof t == "object" && t && typeof t.status == "number" && typeof t.statusText == "string") return new Ne(t.status, t.statusText, t.data);
	} catch {}
}
function lt(e, { relative: t } = {}) {
	x(ut(), "useHref() may be used only in the context of a <Router> component.");
	let { basename: n, navigator: r } = _.useContext(et), { hash: i, pathname: a, search: o } = gt(e, { relative: t }), s = a;
	return n !== "/" && (s = a === "/" ? n : D([n, a])), r.createHref({
		pathname: s,
		search: o,
		hash: i
	});
}
function ut() {
	return _.useContext(tt) != null;
}
function dt() {
	return x(ut(), "useLocation() may be used only in the context of a <Router> component."), _.useContext(tt).location;
}
var ft = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
function pt(e) {
	_.useContext(et).static || _.useLayoutEffect(e);
}
function mt() {
	let { isDataRoute: e } = _.useContext(nt);
	return e ? Mt() : ht();
}
function ht() {
	x(ut(), "useNavigate() may be used only in the context of a <Router> component.");
	let e = _.useContext(qe), { basename: t, navigator: n } = _.useContext(et), { matches: r } = _.useContext(nt), { pathname: i } = dt(), a = JSON.stringify(De(r)), o = _.useRef(!1);
	return pt(() => {
		o.current = !0;
	}), _.useCallback((r, s = {}) => {
		if (S(o.current, ft), !o.current) return;
		if (typeof r == "number") {
			n.go(r);
			return;
		}
		let c = Oe(r, JSON.parse(a), i, s.relative === "path");
		e == null && t !== "/" && (c.pathname = c.pathname === "/" ? t : D([t, c.pathname])), He(typeof r == "string" ? r : w(r), n.createHref(c), ze(n), "reject"), (s.replace ? n.replace : n.push)(c, s.state, s);
	}, [
		t,
		n,
		a,
		i,
		e
	]);
}
_.createContext(null);
function gt(e, { relative: t } = {}) {
	let { matches: n } = _.useContext(nt), { pathname: r } = dt(), i = JSON.stringify(De(n));
	return _.useMemo(() => Oe(e, JSON.parse(i), r, t === "path"), [
		e,
		i,
		r,
		t
	]);
}
function _t(e, t, n) {
	x(ut(), "useRoutes() may be used only in the context of a <Router> component.");
	let { navigator: r } = _.useContext(et), { matches: i } = _.useContext(nt), a = i[i.length - 1], o = a ? a.params : {}, s = a ? a.pathname : "/", c = a ? a.pathnameBase : "/", l = a && a.route;
	{
		let e = l && l.path || "";
		Pt(s, !l || e.endsWith("*") || e.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${s}" (under <Route path="${e}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${e}"> to <Route path="${e === "/" ? "*" : `${e}/*`}">.`);
	}
	let u = dt(), d;
	if (t) {
		let e = typeof t == "string" ? re(t) : t;
		x(c === "/" || e.pathname?.startsWith(c), `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${c}" but pathname "${e.pathname}" was given in the \`location\` prop.`), d = e;
	} else d = u;
	let f = d.pathname || "/", p = f;
	if (c !== "/") {
		let e = c.replace(/^\//, "").split("/");
		p = "/" + f.replace(/^\//, "").split("/").slice(e.length).join("/");
	}
	let m = n && n.state.matches.length ? n.state.matches.map((e) => Object.assign(e, { route: n.manifest[e.route.id] || e.route })) : ie(e, { pathname: p });
	S(l || m != null, `No routes matched location "${d.pathname}${d.search}${d.hash}" `), S(m == null || m[m.length - 1].route.element !== void 0 || m[m.length - 1].route.Component !== void 0 || m[m.length - 1].route.lazy !== void 0, `Matched leaf route at location "${d.pathname}${d.search}${d.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);
	let h = wt(m && m.map((e) => Object.assign({}, e, {
		params: Object.assign({}, o, e.params),
		pathname: D([c, r.encodeLocation ? r.encodeLocation(e.pathname.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : e.pathname]),
		pathnameBase: e.pathnameBase === "/" ? c : D([c, r.encodeLocation ? r.encodeLocation(e.pathnameBase.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : e.pathnameBase])
	})), i, n);
	return t && h ? /* @__PURE__ */ _.createElement(tt.Provider, { value: {
		location: {
			pathname: "/",
			search: "",
			hash: "",
			state: null,
			key: "default",
			mask: void 0,
			...d
		},
		navigationType: "POP"
	} }, h) : h;
}
function vt() {
	let e = jt(), t = Pe(e) ? `${e.status} ${e.statusText}` : e instanceof Error ? e.message : JSON.stringify(e), n = e instanceof Error ? e.stack : null, r = "rgba(200,200,200, 0.5)", i = {
		padding: "0.5rem",
		backgroundColor: r
	}, a = {
		padding: "2px 4px",
		backgroundColor: r
	}, o = null;
	return console.error("Error handled by React Router default ErrorBoundary:", e), o = /* @__PURE__ */ _.createElement(_.Fragment, null, /* @__PURE__ */ _.createElement("p", null, "💿 Hey developer 👋"), /* @__PURE__ */ _.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */ _.createElement("code", { style: a }, "ErrorBoundary"), " or", " ", /* @__PURE__ */ _.createElement("code", { style: a }, "errorElement"), " prop on your route.")), /* @__PURE__ */ _.createElement(_.Fragment, null, /* @__PURE__ */ _.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ _.createElement("h3", { style: { fontStyle: "italic" } }, t), n ? /* @__PURE__ */ _.createElement("pre", { style: i }, n) : null, o);
}
var yt = /* @__PURE__ */ _.createElement(vt, null), bt = class extends _.Component {
	constructor(e) {
		super(e), this.state = {
			location: e.location,
			revalidation: e.revalidation,
			error: e.error
		};
	}
	static getDerivedStateFromError(e) {
		return { error: e };
	}
	static getDerivedStateFromProps(e, t) {
		return t.location !== e.location || t.revalidation !== "idle" && e.revalidation === "idle" ? {
			error: e.error,
			location: e.location,
			revalidation: e.revalidation
		} : {
			error: e.error === void 0 ? t.error : e.error,
			location: t.location,
			revalidation: e.revalidation || t.revalidation
		};
	}
	componentDidCatch(e, t) {
		this.props.onError ? this.props.onError(e, t) : console.error("React Router caught the following error during render", e);
	}
	render() {
		let e = this.state.error;
		if (this.context && typeof e == "object" && e && "digest" in e && typeof e.digest == "string") {
			let t = ct(e.digest);
			t && (e = t);
		}
		let t = e === void 0 ? this.props.children : /* @__PURE__ */ _.createElement(nt.Provider, { value: this.props.routeContext }, /* @__PURE__ */ _.createElement(rt.Provider, {
			value: e,
			children: this.props.component
		}));
		return this.context ? /* @__PURE__ */ _.createElement(St, { error: e }, t) : t;
	}
};
bt.contextType = Ye;
var xt = /* @__PURE__ */ new WeakMap();
function St({ children: e, error: t }) {
	let { basename: n, navigator: r } = _.useContext(et);
	if (typeof t == "object" && t && "digest" in t && typeof t.digest == "string") {
		let e = st(t.digest);
		if (e) {
			let i = xt.get(t);
			if (i) throw i;
			let a = Le(e.location, n), o = a.absoluteURL || a.to;
			if (He(e.location, o, ze(r), "allow-explicit"), Ke(o)) throw Error("Invalid redirect location");
			if (Ie && !xt.get(t)) {
				if (a.isExternal || e.reloadDocument) window.location.href = o;
				else {
					let n = Promise.resolve().then(() => window.__reactRouterDataRouter.navigate(a.to, { replace: e.replace }));
					throw xt.set(t, n), n;
				}
			}
			return /* @__PURE__ */ _.createElement("meta", {
				httpEquiv: "refresh",
				content: `0;url=${o}`
			});
		}
	}
	return e;
}
function Ct({ routeContext: e, match: t, children: n }) {
	let r = _.useContext(qe);
	return r && r.static && r.staticContext && (t.route.errorElement || t.route.ErrorBoundary) && (r.staticContext._deepestRenderedBoundaryId = t.route.id), /* @__PURE__ */ _.createElement(nt.Provider, { value: e }, n);
}
function wt(e, t = [], n) {
	let r = n?.state;
	if (e == null) {
		if (!r) return null;
		if (r.errors) e = r.matches;
		else if (t.length === 0 && !r.initialized && r.matches.length > 0) e = r.matches;
		else return null;
	}
	let i = e, a = r?.errors;
	if (a != null) {
		let e = i.findIndex((e) => e.route.id && a?.[e.route.id] !== void 0);
		x(e >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(a).join(",")}`), i = i.slice(0, Math.min(i.length, e + 1));
	}
	let o = !1, s = -1;
	if (n && r) {
		o = r.renderFallback;
		for (let e = 0; e < i.length; e++) {
			let t = i[e];
			if ((t.route.HydrateFallback || t.route.hydrateFallbackElement) && (s = e), t.route.id) {
				let { loaderData: e, errors: a } = r, c = t.route.loader && !e.hasOwnProperty(t.route.id) && (!a || a[t.route.id] === void 0);
				if (t.route.lazy || c) {
					n.isStatic && (o = !0), i = s >= 0 ? i.slice(0, s + 1) : [i[0]];
					break;
				}
			}
		}
	}
	let c = n?.onError, l = r && c ? (e, t) => {
		c(e, {
			location: r.location,
			params: r.matches?.[0]?.params ?? {},
			pattern: Fe(r.matches),
			errorInfo: t
		});
	} : void 0;
	return i.reduceRight((e, n, c) => {
		let u, d = !1, f = null, p = null;
		r && (u = a && n.route.id ? a[n.route.id] : void 0, f = n.route.errorElement || yt, o && (s < 0 && c === 0 ? (Pt("route-fallback", !1, "No `HydrateFallback` element provided to render during initial hydration"), d = !0, p = null) : s === c && (d = !0, p = n.route.hydrateFallbackElement || null)));
		let m = t.concat(i.slice(0, c + 1)), h = () => {
			let t;
			return t = u ? f : d ? p : n.route.Component ? /* @__PURE__ */ _.createElement(n.route.Component, null) : n.route.element ? n.route.element : e, /* @__PURE__ */ _.createElement(Ct, {
				match: n,
				routeContext: {
					outlet: e,
					matches: m,
					isDataRoute: r != null
				},
				children: t
			});
		};
		return r && (n.route.ErrorBoundary || n.route.errorElement || c === 0) ? /* @__PURE__ */ _.createElement(bt, {
			location: r.location,
			revalidation: r.revalidation,
			component: f,
			error: u,
			children: h(),
			routeContext: {
				outlet: null,
				matches: m,
				isDataRoute: !0
			},
			onError: l
		}) : h();
	}, null);
}
function Tt(e) {
	return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function Et(e) {
	let t = _.useContext(qe);
	return x(t, Tt(e)), t;
}
function Dt(e) {
	let t = _.useContext(Je);
	return x(t, Tt(e)), t;
}
function Ot(e) {
	let t = _.useContext(nt);
	return x(t, Tt(e)), t;
}
function kt(e) {
	let t = Ot(e), n = t.matches[t.matches.length - 1];
	return x(n.route.id, `${e} can only be used on routes that contain a unique "id"`), n.route.id;
}
function At() {
	return kt("useRouteId");
}
function jt() {
	let e = _.useContext(rt), t = Dt("useRouteError"), n = kt("useRouteError");
	return e === void 0 ? t.errors?.[n] : e;
}
function Mt() {
	let { router: e } = Et("useNavigate"), t = kt("useNavigate"), n = _.useRef(!1);
	return pt(() => {
		n.current = !0;
	}), _.useCallback(async (r, i = {}) => {
		S(n.current, ft), n.current && (typeof r == "number" ? await e.navigate(r) : await e.navigate(r, {
			fromRouteId: t,
			...i
		}));
	}, [e, t]);
}
var Nt = {};
function Pt(e, t, n) {
	!t && !Nt[e] && (Nt[e] = !0, S(!1, n));
}
_.memo(Ft);
function Ft({ routes: e, manifest: t, future: n, state: r, isStatic: i, onError: a }) {
	return _t(e, void 0, {
		manifest: t,
		state: r,
		isStatic: i,
		onError: a,
		future: n
	});
}
function It({ basename: e, children: t, initialEntries: n, initialIndex: r, useTransitions: i }) {
	let a = _.useRef();
	a.current ??= te({
		initialEntries: n,
		initialIndex: r,
		v5Compat: !0
	});
	let o = a.current, [s, c] = _.useState({
		action: o.action,
		location: o.location
	}), l = _.useCallback((e) => {
		i === !1 ? c(e) : _.startTransition(() => c(e));
	}, [i]);
	return _.useLayoutEffect(() => o.listen(l), [o, l]), /* @__PURE__ */ _.createElement(Lt, {
		basename: e,
		children: t,
		location: s.location,
		navigationType: s.action,
		navigator: o,
		useTransitions: i
	});
}
function Lt({ basename: e = "/", children: t = null, location: n, navigationType: r = "POP", navigator: i, static: a = !1, useTransitions: o }) {
	x(!ut(), "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");
	let s = e.replace(/^\/*/, "/"), c = _.useMemo(() => ({
		basename: s,
		navigator: i,
		static: a,
		useTransitions: o,
		future: {}
	}), [
		s,
		i,
		a,
		o
	]);
	typeof n == "string" && (n = re(n));
	let { pathname: l = "/", search: u = "", hash: d = "", state: f = null, key: p = "default", mask: m } = n, h = _.useMemo(() => {
		let e = we(l, s);
		return e == null ? null : {
			location: {
				pathname: e,
				search: u,
				hash: d,
				state: f,
				key: p,
				mask: m
			},
			navigationType: r
		};
	}, [
		s,
		l,
		u,
		d,
		f,
		p,
		r,
		m
	]);
	return S(h != null, `<Router basename="${s}"> is not able to match the URL "${l}${u}${d}" because it does not start with the basename, so the <Router> won't render anything.`), h == null ? null : /* @__PURE__ */ _.createElement(et.Provider, { value: c }, /* @__PURE__ */ _.createElement(tt.Provider, {
		children: t,
		value: h
	}));
}
_.Component;
var Rt = "get", zt = "application/x-www-form-urlencoded";
function Bt(e) {
	return typeof HTMLElement < "u" && e instanceof HTMLElement;
}
function Vt(e) {
	return Bt(e) && e.tagName.toLowerCase() === "button";
}
function Ht(e) {
	return Bt(e) && e.tagName.toLowerCase() === "form";
}
function Ut(e) {
	return Bt(e) && e.tagName.toLowerCase() === "input";
}
function Wt(e) {
	return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function Gt(e, t) {
	return e.button === 0 && (!t || t === "_self") && !Wt(e);
}
var Kt = null;
function qt() {
	if (Kt === null) try {
		new FormData(document.createElement("form"), 0), Kt = !1;
	} catch {
		Kt = !0;
	}
	return Kt;
}
var Jt = /* @__PURE__ */ new Set([
	"application/x-www-form-urlencoded",
	"multipart/form-data",
	"text/plain"
]);
function Yt(e) {
	return e != null && !Jt.has(e) ? (S(!1, `"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${zt}"`), null) : e;
}
function Xt(e, t) {
	let n, r, i, a, o;
	if (Ht(e)) {
		let o = e.getAttribute("action");
		r = o ? we(o, t) : null, n = e.getAttribute("method") || Rt, i = Yt(e.getAttribute("enctype")) || zt, a = new FormData(e);
	} else if (Vt(e) || Ut(e) && (e.type === "submit" || e.type === "image")) {
		let o = e.form;
		if (o == null) throw Error("Cannot submit a <button> or <input type=\"submit\"> without a <form>");
		let s = e.getAttribute("formaction") || o.getAttribute("action");
		if (r = s ? we(s, t) : null, n = e.getAttribute("formmethod") || o.getAttribute("method") || Rt, i = Yt(e.getAttribute("formenctype")) || Yt(o.getAttribute("enctype")) || zt, a = new FormData(o, e), !qt()) {
			let { name: t, type: n, value: r } = e;
			if (n === "image") {
				let e = t ? `${t}.` : "";
				a.append(`${e}x`, "0"), a.append(`${e}y`, "0");
			} else t && a.append(t, r);
		}
	} else if (Bt(e)) throw Error("Cannot submit element that is not <form>, <button>, or <input type=\"submit|image\">");
	else n = Rt, r = null, i = zt, o = e;
	return a && i === "text/plain" && (o = a, a = void 0), {
		action: r,
		method: n.toLowerCase(),
		encType: i,
		formData: a,
		body: o
	};
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function Zt(e, t) {
	if (e === !1 || e == null) throw Error(t);
}
function Qt(e, t, n, r) {
	let i = typeof e == "string" ? new URL(e, typeof window > "u" ? "server://singlefetch/" : window.location.origin) : e;
	return i.pathname = n ? i.pathname.endsWith("/") ? `${i.pathname}_.${r}` : `${i.pathname}.${r}` : i.pathname === "/" ? `_root.${r}` : t && we(i.pathname, t) === "/" ? `${O(t)}/_root.${r}` : `${O(i.pathname)}.${r}`, i;
}
async function $t(e, t) {
	if (e.id in t) return t[e.id];
	try {
		let n = await import(
			/* @vite-ignore */
			/* webpackIgnore: true */
			e.module
);
		return t[e.id] = n, n;
	} catch (t) {
		return console.error(`Error loading route module \`${e.module}\`, reloading page...`), console.error(t), window.__reactRouterContext && window.__reactRouterContext.isSpaMode, window.location.reload(), new Promise(() => {});
	}
}
function en(e) {
	return e != null && typeof e.page == "string";
}
function tn(e) {
	return e == null ? !1 : e.href == null ? e.rel === "preload" && typeof e.imageSrcSet == "string" && typeof e.imageSizes == "string" : typeof e.rel == "string" && typeof e.href == "string";
}
async function k(e, t, n) {
	return sn((await Promise.all(e.map(async (e) => {
		let r = t.routes[e.route.id];
		if (r) {
			let e = await $t(r, n);
			return e.links ? e.links() : [];
		}
		return [];
	}))).flat(1).filter(tn).filter((e) => e.rel === "stylesheet" || e.rel === "preload").map((e) => e.rel === "stylesheet" ? {
		...e,
		rel: "prefetch",
		as: "style"
	} : {
		...e,
		rel: "prefetch"
	}));
}
function nn(e, t, n, r, i, a) {
	let o = (e, t) => !n[t] || e.route.id !== n[t].route.id, s = (e, t) => n[t].pathname !== e.pathname || n[t].route.path?.endsWith("*") && n[t].params["*"] !== e.params["*"];
	return a === "assets" ? t.filter((e, t) => o(e, t) || s(e, t)) : a === "data" ? t.filter((t, a) => {
		let c = r.routes[t.route.id];
		if (!c || !c.hasLoader) return !1;
		if (o(t, a) || s(t, a)) return !0;
		if (t.route.shouldRevalidate) {
			let r = t.route.shouldRevalidate({
				currentUrl: new URL(i.pathname + i.search + i.hash, window.origin),
				currentParams: n[0]?.params || {},
				nextUrl: new URL(e, window.origin),
				nextParams: t.params,
				defaultShouldRevalidate: !0
			});
			if (typeof r == "boolean") return r;
		}
		return !0;
	}) : [];
}
function rn(e, t, { includeHydrateFallback: n } = {}) {
	return an(e.map((e) => {
		let r = t.routes[e.route.id];
		if (!r) return [];
		let i = [r.module];
		return r.clientActionModule && (i = i.concat(r.clientActionModule)), r.clientLoaderModule && (i = i.concat(r.clientLoaderModule)), n && r.hydrateFallbackModule && (i = i.concat(r.hydrateFallbackModule)), r.imports && (i = i.concat(r.imports)), i;
	}).flat(1));
}
function an(e) {
	return [...new Set(e)];
}
function on(e) {
	let t = {}, n = Object.keys(e).sort();
	for (let r of n) t[r] = e[r];
	return t;
}
function sn(e, t) {
	let n = /* @__PURE__ */ new Set(), r = new Set(t);
	return e.reduce((e, i) => {
		if (t && !en(i) && i.as === "script" && i.href && r.has(i.href)) return e;
		let a = JSON.stringify(on(i));
		return n.has(a) || (n.add(a), e.push({
			key: a,
			link: i
		})), e;
	}, []);
}
function cn() {
	let e = _.useContext(qe);
	return Zt(e, "You must render this element inside a <DataRouterContext.Provider> element"), e;
}
function ln() {
	let e = _.useContext(Je);
	return Zt(e, "You must render this element inside a <DataRouterStateContext.Provider> element"), e;
}
var un = _.createContext(void 0);
un.displayName = "FrameworkContext";
function dn() {
	let e = _.useContext(un);
	return Zt(e, "You must render this element inside a <HydratedRouter> element"), e;
}
function fn(e, t) {
	let n = _.useContext(un), [r, i] = _.useState(!1), [a, o] = _.useState(!1), { onFocus: s, onBlur: c, onMouseEnter: l, onMouseLeave: u, onTouchStart: d } = t, f = _.useRef(null);
	_.useEffect(() => {
		if (e === "render" && o(!0), e === "viewport") {
			let e = new IntersectionObserver((e) => {
				e.forEach((e) => {
					o(e.isIntersecting);
				});
			}, { threshold: .5 });
			return f.current && e.observe(f.current), () => {
				e.disconnect();
			};
		}
	}, [e]), _.useEffect(() => {
		if (r) {
			let e = setTimeout(() => {
				o(!0);
			}, 100);
			return () => {
				clearTimeout(e);
			};
		}
	}, [r]);
	let p = () => {
		i(!0);
	}, m = () => {
		i(!1), o(!1);
	};
	return n ? e === "intent" ? [
		a,
		f,
		{
			onFocus: pn(s, p),
			onBlur: pn(c, m),
			onMouseEnter: pn(l, p),
			onMouseLeave: pn(u, m),
			onTouchStart: pn(d, p)
		}
	] : [
		a,
		f,
		{}
	] : [
		!1,
		f,
		{}
	];
}
function pn(e, t) {
	return (n) => {
		e && e(n), n.defaultPrevented || t(n);
	};
}
function mn({ page: e, ...t }) {
	let n = Xe(), { nonce: r } = dn(), { router: i } = cn(), a = _.useMemo(() => ie(i.routes, e, i.basename), [
		i.routes,
		e,
		i.basename
	]);
	return a ? (t.nonce == null && r && (t = {
		...t,
		nonce: r
	}), n ? /* @__PURE__ */ _.createElement(gn, {
		page: e,
		matches: a,
		...t
	}) : /* @__PURE__ */ _.createElement(_n, {
		page: e,
		matches: a,
		...t
	})) : null;
}
function hn(e) {
	let { manifest: t, routeModules: n } = dn(), [r, i] = _.useState([]);
	return _.useEffect(() => {
		let r = !1;
		return k(e, t, n).then((e) => {
			r || i(e);
		}), () => {
			r = !0;
		};
	}, [
		e,
		t,
		n
	]), r;
}
function gn({ page: e, matches: t, ...n }) {
	let r = dt(), { future: i } = dn(), { basename: a } = cn(), o = _.useMemo(() => {
		if (e === r.pathname + r.search + r.hash) return [];
		let n = Qt(e, a, i.v8_trailingSlashAwareDataRequests, "rsc"), o = !1, s = [];
		for (let e of t) typeof e.route.shouldRevalidate == "function" ? o = !0 : s.push(e.route.id);
		return o && s.length > 0 && n.searchParams.set("_routes", s.join(",")), [n.pathname + n.search];
	}, [
		a,
		i.v8_trailingSlashAwareDataRequests,
		e,
		r,
		t
	]);
	return /* @__PURE__ */ _.createElement(_.Fragment, null, o.map((e) => /* @__PURE__ */ _.createElement("link", {
		key: e,
		rel: "prefetch",
		as: "fetch",
		href: e,
		...n
	})));
}
function _n({ page: e, matches: t, ...n }) {
	let r = dt(), { future: i, manifest: a, routeModules: o } = dn(), { basename: s } = cn(), { loaderData: c, matches: l } = ln(), u = _.useMemo(() => nn(e, t, l, a, r, "data"), [
		e,
		t,
		l,
		a,
		r
	]), d = _.useMemo(() => nn(e, t, l, a, r, "assets"), [
		e,
		t,
		l,
		a,
		r
	]), f = _.useMemo(() => {
		if (e === r.pathname + r.search + r.hash) return [];
		let n = /* @__PURE__ */ new Set(), l = !1;
		if (t.forEach((e) => {
			let t = a.routes[e.route.id];
			t && t.hasLoader && (!u.some((t) => t.route.id === e.route.id) && e.route.id in c && o[e.route.id]?.shouldRevalidate || t.hasClientLoader ? l = !0 : n.add(e.route.id));
		}), n.size === 0) return [];
		let d = Qt(e, s, i.v8_trailingSlashAwareDataRequests, "data");
		return l && n.size > 0 && d.searchParams.set("_routes", t.filter((e) => n.has(e.route.id)).map((e) => e.route.id).join(",")), [d.pathname + d.search];
	}, [
		s,
		i.v8_trailingSlashAwareDataRequests,
		c,
		r,
		a,
		u,
		t,
		e,
		o
	]), p = _.useMemo(() => rn(d, a), [d, a]), m = hn(d);
	return /* @__PURE__ */ _.createElement(_.Fragment, null, f.map((e) => /* @__PURE__ */ _.createElement("link", {
		key: e,
		rel: "prefetch",
		as: "fetch",
		href: e,
		...n
	})), p.map((e) => /* @__PURE__ */ _.createElement("link", {
		key: e,
		rel: "modulepreload",
		href: e,
		...n
	})), m.map(({ key: e, link: t }) => /* @__PURE__ */ _.createElement("link", {
		key: e,
		nonce: n.nonce,
		...t,
		crossOrigin: t.crossOrigin ?? n.crossOrigin
	})));
}
function vn(...e) {
	return (t) => {
		e.forEach((e) => {
			typeof e == "function" ? e(t) : e != null && (e.current = t);
		});
	};
}
_.Component;
var yn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0;
try {
	yn && (window.__reactRouterVersion = "7.18.4");
} catch {}
var bn = _.forwardRef(function({ onClick: e, discover: t = "render", prefetch: n = "none", relative: r, reloadDocument: i, replace: a, mask: o, state: s, target: c, to: l, preventScrollReset: u, viewTransition: d, defaultShouldRevalidate: f, ...p }, m) {
	let { basename: h, navigator: g, useTransitions: y } = _.useContext(et), b = typeof l == "string" && v.test(l), ee = Le(l, h);
	l = ee.to;
	let te = lt(l, { relative: r }), x = dt(), S = null;
	if (o) {
		let e = Oe(o, [], x.mask ? x.mask.pathname : "/", !0);
		h !== "/" && (e.pathname = e.pathname === "/" ? h : D([h, e.pathname])), S = g.createHref(e);
	}
	let [C, ne, w] = fn(n, p), re = Tn(l, {
		replace: a,
		mask: o,
		state: s,
		target: c,
		preventScrollReset: u,
		relative: r,
		viewTransition: d,
		defaultShouldRevalidate: f,
		useTransitions: y
	});
	function ie(t) {
		e && e(t), t.defaultPrevented || re(t);
	}
	let ae = !(ee.isExternal || i), oe = /* @__PURE__ */ _.createElement("a", {
		...p,
		...w,
		href: (ae ? S : void 0) || ee.absoluteURL || te,
		onClick: ae ? ie : e,
		ref: vn(m, ne),
		target: c,
		"data-discover": !b && t === "render" ? "true" : void 0
	});
	return C && !b ? /* @__PURE__ */ _.createElement(_.Fragment, null, oe, /* @__PURE__ */ _.createElement(mn, { page: te })) : oe;
});
bn.displayName = "Link";
var xn = _.forwardRef(function({ "aria-current": e = "page", caseSensitive: t = !1, className: n = "", end: r = !1, style: i, to: a, viewTransition: o, children: s, ...c }, l) {
	let u = gt(a, { relative: c.relative }), d = dt(), f = _.useContext(Je), { navigator: p, basename: m } = _.useContext(et), h = f != null && An(u) && o === !0, g = p.encodeLocation ? p.encodeLocation(u).pathname : u.pathname, v = d.pathname, y = f && f.navigation && f.navigation.location ? f.navigation.location.pathname : null;
	t || (v = v.toLowerCase(), y = y ? y.toLowerCase() : null, g = g.toLowerCase()), y && m && (y = we(y, m) || y);
	let b = g !== "/" && g.endsWith("/") ? g.length - 1 : g.length, ee = v === g || !r && v.startsWith(g) && v.charAt(b) === "/", te = y != null && (y === g || !r && y.startsWith(g) && y.charAt(g.length) === "/"), x = {
		isActive: ee,
		isPending: te,
		isTransitioning: h
	}, S = ee ? e : void 0, C;
	C = typeof n == "function" ? n(x) : [
		n,
		ee ? "active" : null,
		te ? "pending" : null,
		h ? "transitioning" : null
	].filter(Boolean).join(" ");
	let ne = typeof i == "function" ? i(x) : i;
	return /* @__PURE__ */ _.createElement(bn, {
		...c,
		"aria-current": S,
		className: C,
		ref: l,
		style: ne,
		to: a,
		viewTransition: o
	}, typeof s == "function" ? s(x) : s);
});
xn.displayName = "NavLink";
var Sn = _.forwardRef(({ discover: e = "render", fetcherKey: t, navigate: n, reloadDocument: r, replace: i, state: a, method: o = Rt, action: s, onSubmit: c, relative: l, preventScrollReset: u, viewTransition: d, defaultShouldRevalidate: f, ...p }, m) => {
	let { useTransitions: h } = _.useContext(et), g = On(), y = kn(s, { relative: l }), b = o.toLowerCase() === "get" ? "get" : "post", ee = typeof s == "string" && v.test(s);
	return /* @__PURE__ */ _.createElement("form", {
		ref: m,
		method: b,
		action: y,
		onSubmit: r ? c : (e) => {
			if (c && c(e), e.defaultPrevented) return;
			e.preventDefault();
			let r = e.nativeEvent.submitter, s = r?.getAttribute("formmethod") || o, p = () => g(r || e.currentTarget, {
				fetcherKey: t,
				method: s,
				navigate: n,
				replace: i,
				state: a,
				relative: l,
				preventScrollReset: u,
				viewTransition: d,
				defaultShouldRevalidate: f
			});
			h && n !== !1 ? _.startTransition(() => p()) : p();
		},
		...p,
		"data-discover": !ee && e === "render" ? "true" : void 0
	});
});
Sn.displayName = "Form";
function Cn(e) {
	return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function wn(e) {
	let t = _.useContext(qe);
	return x(t, Cn(e)), t;
}
function Tn(e, { target: t, replace: n, mask: r, state: i, preventScrollReset: a, relative: o, viewTransition: s, defaultShouldRevalidate: c, useTransitions: l } = {}) {
	let u = mt(), d = dt(), f = gt(e, { relative: o });
	return _.useCallback((p) => {
		if (Gt(p, t)) {
			p.preventDefault();
			let t = n === void 0 ? w(d) === w(f) : n, m = () => u(e, {
				replace: t,
				mask: r,
				state: i,
				preventScrollReset: a,
				relative: o,
				viewTransition: s,
				defaultShouldRevalidate: c
			});
			l ? _.startTransition(() => m()) : m();
		}
	}, [
		d,
		u,
		f,
		n,
		r,
		i,
		t,
		e,
		a,
		o,
		s,
		c,
		l
	]);
}
var En = 0, Dn = () => `__${String(++En)}__`;
function On() {
	let { router: e } = wn("useSubmit"), { basename: t } = _.useContext(et), n = At(), r = e.fetch, i = e.navigate;
	return _.useCallback(async (e, a = {}) => {
		let { action: o, method: s, encType: c, formData: l, body: u } = Xt(e, t);
		if (a.navigate === !1) {
			let e = a.fetcherKey || Dn();
			await r(e, n, a.action || o, {
				defaultShouldRevalidate: a.defaultShouldRevalidate,
				preventScrollReset: a.preventScrollReset,
				formData: l,
				body: u,
				formMethod: a.method || s,
				formEncType: a.encType || c,
				flushSync: a.flushSync
			});
		} else await i(a.action || o, {
			defaultShouldRevalidate: a.defaultShouldRevalidate,
			preventScrollReset: a.preventScrollReset,
			formData: l,
			body: u,
			formMethod: a.method || s,
			formEncType: a.encType || c,
			replace: a.replace,
			state: a.state,
			fromRouteId: n,
			flushSync: a.flushSync,
			viewTransition: a.viewTransition
		});
	}, [
		r,
		i,
		t,
		n
	]);
}
function kn(e, { relative: t } = {}) {
	let { basename: n } = _.useContext(et), r = _.useContext(nt);
	x(r, "useFormAction must be used inside a RouteContext");
	let [i] = r.matches.slice(-1), a = { ...gt(e || ".", { relative: t }) }, o = dt();
	if (e == null) {
		a.search = o.search;
		let e = new URLSearchParams(a.search), t = e.getAll("index");
		if (t.some((e) => e === "")) {
			e.delete("index"), t.filter((e) => e).forEach((t) => e.append("index", t));
			let n = e.toString();
			a.search = n ? `?${n}` : "";
		}
	}
	return (!e || e === ".") && i.route.index && (a.search = a.search ? a.search.replace(/^\?/, "?index&") : "?index"), n !== "/" && (a.pathname = a.pathname === "/" ? n : D([n, a.pathname])), w(a);
}
function An(e, { relative: t } = {}) {
	let n = _.useContext(Ze);
	x(n != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
	let { basename: r } = wn("useViewTransitionState"), i = gt(e, { relative: t });
	if (!n.isTransitioning) return !1;
	let a = we(n.currentLocation.pathname, r) || n.currentLocation.pathname, o = we(n.nextLocation.pathname, r) || n.nextLocation.pathname;
	return be(i.pathname, o) != null || be(i.pathname, a) != null;
}
//#endregion
//#region node_modules/zod/v4/core/util.js
function jn(e) {
	let t = Object.values(e).filter((e) => typeof e == "number");
	return Object.entries(e).filter(([e, n]) => t.indexOf(+e) === -1).map(([e, t]) => t);
}
function Mn(e, t = "|") {
	return e.map((e) => rr(e)).join(t);
}
function Nn(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
var Pn = class {
	constructor(e) {
		this._getter = e, this._value = void 0;
	}
	get value() {
		let e = this._getter;
		return e !== void 0 && (this._value = e(), this._getter = void 0), this._value;
	}
};
function Fn(e) {
	return new Pn(e);
}
function In(e) {
	return e == null;
}
function Ln(e) {
	let t = +!!e.startsWith("^"), n = e.endsWith("$") ? e.length - 1 : e.length;
	return e.slice(t, n);
}
function Rn(e, t) {
	let n = e / t, r = Math.round(n), i = 4 * 2 ** -52 * Math.max(Math.abs(n), 1);
	return Math.abs(n - r) < i ? 0 : n - r;
}
function zn(e, t, n) {
	Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
}
function Bn(e) {
	let t = Object.getOwnPropertyDescriptor(e, "shape");
	return t?.get ? t.get.raw : t?.value;
}
function Vn(e) {
	return Bn(e._zod.def) ?? e._zod.def.shape;
}
function Hn(e, t, n) {
	Object.defineProperty(e, t, {
		get() {
			let e = n();
			return zn(this, t, e), e;
		},
		enumerable: !0,
		configurable: !0
	});
}
function Un(e, t, n) {
	t in e ? zn(e, t, n) : e[t] = n;
}
function Wn(e, t, n, r) {
	let i = Vn(t);
	for (let a of n) {
		let n = Object.getOwnPropertyDescriptor(i, a);
		n.enumerable && (n.get ? Hn(e, a, () => {
			let e = t._zod.def.shape[a];
			return r ? r(e, a) : e;
		}) : Un(e, a, r ? r(n.value, a) : n.value));
	}
}
function Gn(e, t) {
	for (let n of Reflect.ownKeys(t)) {
		let r = Object.getOwnPropertyDescriptor(t, n);
		r.enumerable && (r.get ? Hn(e, n, () => t[n]) : Un(e, n, r.value));
	}
}
function Kn(...e) {
	let t = {};
	for (let n of e) {
		let e = Object.getOwnPropertyDescriptors(n);
		Object.assign(t, e);
	}
	return Object.defineProperties({}, t);
}
function qn(e) {
	return JSON.stringify(e);
}
function Jn(e) {
	return e.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var Yn = "captureStackTrace" in Error ? Error.captureStackTrace : (...e) => {};
function Xn(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var Zn = /* @__PURE__*/ Fn(() => {
	if (Gr.jitless || typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return !1;
	try {
		return Function(""), !0;
	} catch {
		return !1;
	}
});
function Qn(e) {
	if (Xn(e) === !1) return !1;
	let t = e.constructor;
	if (t === void 0 || typeof t != "function") return !0;
	let n = t.prototype;
	return Xn(n) !== !1 && Object.prototype.hasOwnProperty.call(n, "isPrototypeOf") !== !1;
}
function $n(e) {
	return Qn(e) ? { ...e } : Array.isArray(e) ? [...e] : e instanceof Map ? new Map(e) : e instanceof Set ? new Set(e) : e;
}
var er = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function tr(e) {
	return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function nr(e, t, n) {
	let r = new e._zod.constr(t ?? e._zod.def);
	return (!t || n?.parent) && (r._zod.parent = e), r;
}
function A(e) {
	let t = e;
	if (!t) return {};
	if (typeof t == "string") return { error: () => t };
	if (t?.message !== void 0) {
		if (t?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
		t.error = t.message;
	}
	return delete t.message, typeof t.error == "string" ? {
		...t,
		error: () => t.error
	} : t;
}
function rr(e) {
	return typeof e == "bigint" ? e.toString() + "n" : typeof e == "string" ? `"${e}"` : `${e}`;
}
function ir(e) {
	return Object.keys(e).filter((t) => e[t]._zod.optin !== void 0 && e[t]._zod.optout === "optional");
}
var ar = {
	safeint: [-(2 ** 53 - 1), 2 ** 53 - 1],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}, or = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function sr(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".pick() cannot be used on object schemas containing refinements");
	let i = {};
	return Wn(i, e, cr(e, t)), nr(e, Kn(n, {
		shape: i,
		checks: []
	}));
}
function cr(e, t) {
	let n = Vn(e), r = [];
	for (let e of Reflect.ownKeys(t)) {
		if (!Object.getOwnPropertyDescriptor(n, e)?.enumerable) throw Error(`Unrecognized key: "${String(e)}"`);
		t[e] && r.push(e);
	}
	return r;
}
function lr(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".omit() cannot be used on object schemas containing refinements");
	let i = new Set(cr(e, t)), a = {};
	return Wn(a, e, Reflect.ownKeys(Vn(e)).filter((e) => !i.has(e))), nr(e, Kn(n, {
		shape: a,
		checks: []
	}));
}
function ur(e, t) {
	if (!Qn(t)) throw Error("Invalid input to extend: expected a plain object");
	let n = e._zod.def.checks;
	if (n && n.length > 0) {
		let n = Vn(e);
		for (let e of Reflect.ownKeys(t)) if (Object.getOwnPropertyDescriptor(n, e) !== void 0) throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return nr(e, Kn(e._zod.def, { shape: dr(e, t) }));
}
function dr(e, t) {
	let n = {};
	return Wn(n, e, Reflect.ownKeys(Vn(e))), Gn(n, t), n;
}
function fr(e, t) {
	if (!Qn(t)) throw Error("Invalid input to safeExtend: expected a plain object");
	return nr(e, Kn(e._zod.def, { shape: dr(e, t) }));
}
function pr(e, t) {
	if (!t?._zod?.def) throw Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (e._zod.def.checks?.length) throw Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	let n = {};
	return Wn(n, e, Reflect.ownKeys(Vn(e))), Wn(n, t, Reflect.ownKeys(Vn(t))), nr(e, Kn(e._zod.def, {
		shape: n,
		get catchall() {
			return t._zod.def.catchall;
		},
		checks: t._zod.def.checks ?? []
	}));
}
function mr(e, t, n, r = "partial") {
	let i = t._zod.def.checks;
	if (i && i.length > 0) throw Error(`.${r}() cannot be used on object schemas containing refinements`);
	let a = n ? new Set(cr(t, n)) : void 0, o = {};
	return Wn(o, t, Reflect.ownKeys(Vn(t)), e && ((t, n) => a && !a.has(n) ? t : new e({
		type: "optional",
		innerType: t
	}))), nr(t, Kn(t._zod.def, {
		shape: o,
		checks: []
	}));
}
function hr(e, t, n) {
	let r = n ? new Set(cr(t, n)) : void 0, i = {};
	return Wn(i, t, Reflect.ownKeys(Vn(t)), (t, n) => r && !r.has(n) ? t : new e({
		type: "nonoptional",
		innerType: t
	})), nr(t, Kn(t._zod.def, { shape: i }));
}
function gr(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue !== !0) return !0;
	return !1;
}
function _r(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue === !1) return !0;
	return !1;
}
function vr(e, t) {
	return t.map((t) => {
		var n;
		return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
	});
}
function yr(e) {
	return typeof e == "string" ? e : e?.message;
}
function br(e, t, n) {
	var r;
	for (let i = t; i < e.length; i++) (r = e[i]).schema ?? (r.schema = n);
}
function xr(e, t, n) {
	var r;
	let i = e.inst?._zod?.traits;
	i?.has("$ZodType") && (i.has("$ZodCheck") ? (r = e).schema ?? (r.schema = e.inst) : e.schema = e.inst);
	let a = e.schema === e.inst ? void 0 : e.schema?._zod.def?.error, o = e.message ? e.message : yr(e.inst?._zod.def?.error?.(e)) ?? yr(a?.(e)) ?? yr(t?.error?.(e)) ?? yr(n.customError?.(e)) ?? yr(n.localeError?.(e)) ?? "Invalid input", s = {};
	for (let t of Object.keys(e)) t !== "inst" && t !== "schema" && t !== "continue" && t !== "input" && t !== "__proto__" && (s[t] = e[t]);
	return s.path ??= [], s.message = o, t?.reportInput && (s.input = e.input), s;
}
var Sr = /[\uD800-\uDBFF]/;
function Cr(e) {
	let t = e.length;
	if (!Sr.test(e)) return t;
	let n = t;
	for (let r = 0; r < t - 1; r++) (e.charCodeAt(r) & 64512) == 55296 && (e.charCodeAt(r + 1) & 64512) == 56320 && (n--, r++);
	return n;
}
function wr(e) {
	return Array.isArray(e) ? "array" : typeof e == "string" ? "string" : "unknown";
}
function Tr(e) {
	let t = typeof e;
	switch (t) {
		case "number": return Number.isNaN(e) ? "nan" : "number";
		case "object": {
			if (e === null) return "null";
			if (Array.isArray(e)) return "array";
			let t = e;
			if (t && Object.getPrototypeOf(t) !== Object.prototype && "constructor" in t && t.constructor) return t.constructor.name;
		}
	}
	return t;
}
function Er(...e) {
	let [t, n, r] = e;
	return typeof t == "string" ? {
		message: t,
		code: "custom",
		input: n,
		inst: r
	} : { ...t };
}
function Dr(e, t) {
	for (let n in t) {
		let r = Object.getOwnPropertyDescriptor(t, n);
		r.get ? Object.defineProperty(e, n, {
			...r,
			enumerable: !1
		}) : jr(e, n, r.value);
	}
}
function Or(e, t, n, r = !0) {
	return Object.defineProperty(e, t, {
		configurable: !0,
		writable: !0,
		enumerable: r,
		value: n
	}), n;
}
function kr(e, t, n) {
	return Or(e, t, n, !1);
}
function Ar(e, t) {
	for (let n in e) {
		let r = e[n];
		Object.defineProperty(t, n, {
			configurable: !0,
			enumerable: !0,
			get() {
				return Or(this, n, r(this));
			},
			set(e) {
				Or(this, n, e);
			}
		});
	}
	return t;
}
function jr(e, t, n) {
	Object.defineProperty(e, t, {
		configurable: !0,
		get() {
			return this == null ? n : Or(this, t, n.bind(this));
		},
		set(e) {
			Or(this, t, e);
		}
	});
}
function Mr(e, t) {
	let n = Object.getPrototypeOf(e);
	return t in n ? void 0 : n;
}
var Nr, Pr = !1, Fr = {
	configurable: !0,
	get() {
		Pr = !0;
	}
};
function j(e, t, n) {
	let r = Object.getPrototypeOf(e._zod);
	if (t in r && Nr !== e._zod) {
		Nr = void 0;
		return;
	}
	Nr = e._zod, Object.defineProperty(r, t, {
		configurable: !0,
		get() {
			Object.defineProperty(this, t, Fr);
			let e = Pr;
			Pr = !1;
			try {
				let r = n(this);
				return Pr ? delete this[t] : Object.defineProperty(this, t, {
					configurable: !0,
					writable: !0,
					value: r
				}), Pr ||= e, r;
			} catch (n) {
				throw delete this[t], Pr ||= e, n;
			}
		},
		set(e) {
			Object.defineProperty(this, t, {
				configurable: !0,
				writable: !0,
				value: e
			});
		}
	});
}
function Ir(e, t, n, r) {
	let i = Mr(e, t);
	i && Object.defineProperty(i, t, {
		configurable: !0,
		get() {
			let e = {
				configurable: !0,
				writable: !0,
				enumerable: r,
				value: void 0
			};
			return Object.defineProperty(this, t, e), e.value = n(this), Object.defineProperty(this, t, e), e.value;
		},
		set(e) {
			Object.defineProperty(this, t, {
				configurable: !0,
				writable: !0,
				enumerable: r,
				value: e
			});
		}
	});
}
var Lr = "~constantCatch";
function Rr(e) {
	let t = () => e;
	return t[Lr] = !0, t;
}
//#endregion
//#region node_modules/zod/v4/core/core.js
var zr, Br = {
	value: void 0,
	enumerable: !1
}, Vr = "captureStackTrace" in Error ? Error : null;
function Hr(e) {
	let t = Vr;
	if (t) {
		let n = t.stackTraceLimit;
		if (typeof n == "number") {
			try {
				t.stackTraceLimit = 0;
			} catch {
				return Vr = null, new e();
			}
			try {
				return new e();
			} finally {
				t.stackTraceLimit = n;
			}
		}
	}
	return new e();
}
function M(e, t, n, r) {
	let i = {};
	function a(e) {
		this.def = e, this.constr = d, this.traits = /* @__PURE__ */ new Set();
	}
	a.prototype = i;
	let o = n, s = o && /* @__PURE__ */ new WeakSet();
	function c(n, r) {
		if (!n._zod) {
			Br.value = new a(r);
			try {
				Object.defineProperty(n, "_zod", Br);
			} finally {
				Br.value = void 0;
			}
		} else if (n._zod.traits.has(e)) return;
		if (n._zod.traits.add(e), t(n, r), s) {
			let e = Object.getPrototypeOf(n), t = n._zod.constr.prototype, r = e;
			for (; r && r !== t;) r = Object.getPrototypeOf(r);
			let i = r ?? e;
			s.has(i) || (s.add(i), Dr(i, o));
		}
		let i = d.prototype;
		for (let e in i) Object.prototype.hasOwnProperty.call(i, e) && (e in n || (n[e] = i[e].bind(n)));
	}
	let l = r?.Parent ?? Object;
	class u extends l {}
	Object.defineProperty(u, "name", { value: e });
	function d(e) {
		let t = r?.Parent ? Hr(u) : this;
		c(t, e);
		let n = t._zod.deferred;
		if (n) {
			for (let e of n) e();
			t._zod.deferred = void 0;
		}
		let i = globalThis.__zod_globalConfig?.postProcessor;
		return i && i(t), t;
	}
	return Object.defineProperty(d, "init", { value: c }), Object.defineProperty(d, Symbol.hasInstance, { value: (t) => r?.Parent && t instanceof r.Parent ? !0 : t?._zod?.traits?.has(e) }), Object.defineProperty(d, "name", { value: e }), d;
}
var Ur = class extends Error {
	constructor() {
		super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
	}
}, Wr = class extends Error {
	constructor(e) {
		super(`Encountered unidirectional transform during encode: ${e}`), this.name = "ZodEncodeError";
	}
};
(zr = globalThis).__zod_globalConfig ?? (zr.__zod_globalConfig = {});
var Gr = globalThis.__zod_globalConfig;
function Kr(e) {
	return e && Object.assign(Gr, e), Gr;
}
//#endregion
//#region node_modules/zod/v4/core/errors.js
function qr() {
	let e = this._zod;
	return e.message ??= JSON.stringify(e.def, Nn, 2), e.message;
}
function Jr(e) {
	this._zod.message = e;
}
var Yr = {
	get: qr,
	set: Jr,
	enumerable: !0,
	configurable: !0
}, Xr = {
	value: void 0,
	enumerable: !1
}, Zr = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]), Qr = (e, t) => {
	e.name = "$ZodError", Xr.value = t, Object.defineProperty(e, "issues", Xr), Xr.value = void 0, Object.defineProperty(e, "message", Yr);
	let n = Object.getPrototypeOf(e);
	Zr.has(n) || (Zr.add(n), Object.defineProperty(n, "toString", {
		configurable: !0,
		enumerable: !1,
		get() {
			let e = () => this.message;
			return Object.defineProperty(this, "toString", {
				value: e,
				configurable: !0,
				writable: !0
			}), e;
		},
		set(e) {
			Object.defineProperty(this, "toString", {
				value: e,
				configurable: !0,
				writable: !0
			});
		}
	}));
}, $r = M("$ZodError", Qr);
M("$ZodError", Qr, void 0, { Parent: Error });
function ei(e, t, n) {
	return Object.prototype.hasOwnProperty.call(e, t) || (t === "__proto__" ? Object.defineProperty(e, t, {
		value: n(),
		writable: !0,
		enumerable: !0,
		configurable: !0
	}) : e[t] = n()), e[t];
}
function ti(e, t = (e) => e.message) {
	let n = {}, r = [];
	for (let i of e.issues) i.path.length > 0 ? ei(n, i.path[0], () => []).push(t(i)) : r.push(t(i));
	return {
		formErrors: r,
		fieldErrors: n
	};
}
function ni(e, t = (e) => e.message) {
	let n = { _errors: [] }, r = (e, i = []) => {
		for (let a of e.issues) if (a.code === "invalid_union" && a.errors.length) a.errors.map((e) => r({ issues: e }, [...i, ...a.path]));
		else if (a.code === "invalid_key") r({ issues: a.issues }, [...i, ...a.path]);
		else if (a.code === "invalid_element") r({ issues: a.issues }, [...i, ...a.path]);
		else {
			let e = [...i, ...a.path];
			if (e.length === 0) n._errors.push(t(a));
			else {
				let r = n, i = 0;
				for (; i < e.length;) {
					let n = e[i], o = i === e.length - 1;
					if (n === "_errors") {
						o && r._errors.push(t(a)), i++;
						continue;
					}
					Object.prototype.hasOwnProperty.call(r, n) || Object.defineProperty(r, n, {
						value: { _errors: [] },
						enumerable: !0,
						writable: !0,
						configurable: !0
					});
					let s = r[n];
					o && s._errors.push(t(a)), r = s, i++;
				}
			}
		}
	};
	return r(e), n;
}
//#endregion
//#region node_modules/zod/v4/core/parse.js
function ri(e, t) {
	return {
		callee: t?.callee ?? e,
		Err: t?.Err
	};
}
var ii = (e) => {
	let t = (n, r, i, a) => {
		let o = i ? {
			...i,
			async: !1
		} : { async: !1 }, s = n._zod.run({
			value: r,
			issues: []
		}, o);
		if (s instanceof Promise) throw new Ur();
		if (s.issues.length) {
			let n = new ((a?.Err) ?? e)(s.issues.map((e) => xr(e, o, Kr())));
			throw Yn(n, a?.callee ?? t), n;
		}
		return s.value;
	};
	return t;
}, ai = (e) => {
	let t = async (n, r, i, a) => {
		let o = i ? {
			...i,
			async: !0
		} : { async: !0 }, s = n._zod.run({
			value: r,
			issues: []
		}, o);
		if (s instanceof Promise && (s = await s), s.issues.length) {
			let n = new ((a?.Err) ?? e)(s.issues.map((e) => xr(e, o, Kr())));
			throw Yn(n, a?.callee ?? t), n;
		}
		return s.value;
	};
	return t;
}, oi = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		async: !1
	} : { async: !1 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	if (a instanceof Promise) throw new Ur();
	return a.issues.length ? si(e, a.issues, i) : {
		success: !0,
		data: a.value
	};
};
function si(e, t, n) {
	let r;
	return {
		success: !1,
		get error() {
			return r || (r = new e(t.map((e) => xr(e, n, Kr()))), t = void 0, n = void 0), r;
		},
		set error(e) {
			r = e, t = void 0, n = void 0;
		}
	};
}
var ci = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		async: !0
	} : { async: !0 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	return a instanceof Promise && (a = await a), a.issues.length ? si(e, a.issues, i) : {
		success: !0,
		data: a.value
	};
}, li = /* @__PURE__ */ Symbol.for("zod.compile.invalid"), ui = /* @__PURE__ */ Symbol.for("zod.compile.fallback"), di = ((e, t, n) => {
	let r = e._zod.bag.validator;
	if (r !== void 0) {
		if (r(t) !== li) return !0;
		if (r.definite === !0 && n === void 0) return !1;
	}
	return fi(e, t, n);
});
function fi(e, t, n) {
	let r = n ? {
		...n,
		async: !1,
		abortEarly: !0
	} : {
		async: !1,
		abortEarly: !0
	}, i = e._zod.bag.fallbackRun, a;
	if (i ? (r[ui] = !0, a = i({
		value: t,
		issues: []
	}, r)) : a = e._zod.run({
		value: t,
		issues: []
	}, r), a instanceof Promise) throw new Ur();
	return a.issues.length === 0;
}
var pi = async (e, t, n) => {
	let r = n ? {
		...n,
		async: !0,
		abortEarly: !0
	} : {
		async: !0,
		abortEarly: !0
	}, i = e._zod.run({
		value: t,
		issues: []
	}, r);
	return i instanceof Promise && (i = await i), i.issues.length === 0;
}, mi = (e) => {
	let t = ii(e), n = (e, r, i, a) => {
		let o = i ? {
			...i,
			direction: "backward"
		} : { direction: "backward" };
		return t(e, r, o, ri(n, a));
	};
	return n;
}, hi = (e) => {
	let t = ii(e), n = (e, r, i, a) => t(e, r, i, ri(n, a));
	return n;
}, gi = (e) => {
	let t = ai(e), n = async (e, r, i, a) => {
		let o = i ? {
			...i,
			direction: "backward"
		} : { direction: "backward" };
		return await t(e, r, o, ri(n, a));
	};
	return n;
}, _i = (e) => {
	let t = ai(e), n = async (e, r, i, a) => await t(e, r, i, ri(n, a));
	return n;
}, vi = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return oi(e)(t, n, i);
}, yi = (e) => (t, n, r) => oi(e)(t, n, r), bi = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return ci(e)(t, n, i);
}, xi = (e) => async (t, n, r) => ci(e)(t, n, r), Si = /^[cC][0-9a-z]{6,}$/, Ci = /^[0-9a-z]+$/, wi = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/, Ti = /^[0-9a-vA-V]{20}$/, Ei = /^[A-Za-z0-9]{27}$/, Di = /^[a-zA-Z0-9_-]{21}$/;
function Oi(e) {
	return RegExp(`^[a-zA-Z0-9_-]{${e}}$`);
}
var ki = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/, Ai = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, ji = (e) => e ? RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/, Mi = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/, Ni = "^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$";
function Pi() {
	return new RegExp(Ni, "u");
}
var Fi = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Ii = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/, Li = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, Ri = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, zi = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, Bi = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/, Vi = /^https?$/, Hi = /^\+[1-9]\d{6,14}$/, Ui = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
function Wi(e) {
	return RegExp(`^${e}$`);
}
var Gi = /*@__PURE__*/ Wi(Ui);
function Ki(e) {
	let t = "(?:[01]\\d|2[0-3]):[0-5]\\d";
	return typeof e.precision == "number" ? e.precision === -1 ? `${t}` : e.precision === 0 ? `${t}:[0-5]\\d` : `${t}:[0-5]\\d\\.\\d{${e.precision}}` : e.seconds ? `${t}:[0-5]\\d(?:\\.\\d+)?` : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function qi(e) {
	return RegExp(`^${Ki(e)}$`);
}
function Ji(e) {
	let t = ["Z"];
	e.offset && t.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
	let n = `${Ki({
		precision: e.precision,
		seconds: !0
	})}(?:${t.join("|")})`, r = e.local ? `${n}|${Ki({ precision: e.precision })}` : n;
	return RegExp(`^${Ui}T(?:${r})$`);
}
var Yi = /^[\s\S]{0,}$/, Xi = /^-?\d+(?:\.\d+)?$/, Zi = /^(?:true|false)$/i, Qi = /^[^A-Z]*$/, $i = /^[^a-z]*$/, N = /*@__PURE__*/ M("$ZodCheck", (e, t) => {
	var n;
	e._zod ??= {}, e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), ea = (e) => {
	let t = e.value;
	return !In(t) && t.length !== void 0;
}, ta = {
	number: "number",
	bigint: "bigint",
	object: "date"
}, na = /*@__PURE__*/ M("$ZodCheckLessThan", (e, t) => {
	N.init(e, t);
	let n = ta[typeof t.value];
	e._zod.check = (r) => {
		(t.inclusive ? r.value <= t.value : r.value < t.value) || r.issues.push({
			origin: ta[typeof r.value] ?? n,
			code: "too_big",
			maximum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), ra = /*@__PURE__*/ M("$ZodCheckGreaterThan", (e, t) => {
	N.init(e, t);
	let n = ta[typeof t.value];
	e._zod.check = (r) => {
		(t.inclusive ? r.value >= t.value : r.value > t.value) || r.issues.push({
			origin: ta[typeof r.value] ?? n,
			code: "too_small",
			minimum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), ia = /*@__PURE__*/ M("$ZodCheckMultipleOf", (e, t) => {
	N.init(e, t), e._zod.check = (n) => {
		if (typeof n.value != typeof t.value) throw Error("Cannot mix number and bigint in multiple_of check.");
		(typeof n.value == "bigint" ? t.value !== BigInt(0) && n.value % t.value === BigInt(0) : Rn(n.value, t.value) === 0) || n.issues.push({
			origin: typeof n.value,
			code: "not_multiple_of",
			divisor: t.value,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), aa = /*@__PURE__*/ M("$ZodCheckNumberFormat", (e, t) => {
	N.init(e, t), t.format = t.format || "float64";
	let n = t.format?.includes("int"), r = n ? "int" : "number", [i, a] = ar[t.format];
	e._zod.check = (o) => {
		let s = o.value;
		if (n) {
			if (!Number.isInteger(s)) {
				o.issues.push({
					expected: r,
					format: t.format,
					code: "invalid_type",
					continue: !1,
					input: s,
					inst: e
				});
				return;
			}
			if (!Number.isSafeInteger(s)) {
				s > 0 ? o.issues.push({
					input: s,
					code: "too_big",
					maximum: 2 ** 53 - 1,
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				}) : o.issues.push({
					input: s,
					code: "too_small",
					minimum: -(2 ** 53 - 1),
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				});
				return;
			}
		}
		s < i && o.issues.push({
			origin: "number",
			input: s,
			code: "too_small",
			minimum: i,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		}), s > a && o.issues.push({
			origin: "number",
			input: s,
			code: "too_big",
			maximum: a,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		});
	};
}), oa = /*@__PURE__*/ M("$ZodCheckMaxLength", (e, t) => {
	var n;
	N.init(e, t), (n = e._zod.def).when ?? (n.when = ea), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if ((typeof r == "string" && i > t.maximum ? Cr(r) : i) <= t.maximum) return;
		let a = wr(r);
		n.issues.push({
			origin: a,
			code: "too_big",
			maximum: t.maximum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), sa = /*@__PURE__*/ M("$ZodCheckMinLength", (e, t) => {
	var n;
	N.init(e, t), (n = e._zod.def).when ?? (n.when = ea), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if ((typeof r == "string" && i >= t.minimum && i < t.minimum * 2 ? Cr(r) : i) >= t.minimum) return;
		let a = wr(r);
		n.issues.push({
			origin: a,
			code: "too_small",
			minimum: t.minimum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), ca = /*@__PURE__*/ M("$ZodCheckLengthEquals", (e, t) => {
	var n;
	N.init(e, t), (n = e._zod.def).when ?? (n.when = ea), e._zod.check = (n) => {
		let r = n.value, i = r.length, a = typeof r == "string" && i >= t.length && i <= t.length * 2 ? Cr(r) : i;
		if (a === t.length) return;
		let o = wr(r), s = a > t.length;
		n.issues.push({
			origin: o,
			...s ? {
				code: "too_big",
				maximum: t.length
			} : {
				code: "too_small",
				minimum: t.length
			},
			inclusive: !0,
			exact: !0,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), la = /*@__PURE__*/ M("$ZodCheckStringFormat", (e, t) => {
	var n, r;
	N.init(e, t), t.pattern ? (n = e._zod).check ?? (n.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: t.format,
			input: n.value,
			...t.pattern ? { pattern: t.pattern.toString() } : {},
			inst: e,
			continue: !t.abort
		});
	}) : (r = e._zod).check ?? (r.check = () => {});
}), P = /*@__PURE__*/ M("$ZodCheckRegex", (e, t) => {
	la.init(e, t), e._zod.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: n.value,
			pattern: t.pattern.toString(),
			inst: e,
			continue: !t.abort
		});
	};
}), F = /*@__PURE__*/ M("$ZodCheckLowerCase", (e, t) => {
	t.pattern ??= Qi, la.init(e, t);
}), ua = /*@__PURE__*/ M("$ZodCheckUpperCase", (e, t) => {
	t.pattern ??= $i, la.init(e, t);
}), da = /*@__PURE__*/ M("$ZodCheckIncludes", (e, t) => {
	N.init(e, t);
	let n = tr(t.includes);
	t.pattern = new RegExp(typeof t.position == "number" ? `^.{${t.position},}${n}` : n), e._zod.check = (n) => {
		n.value.includes(t.includes, t.position) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: t.includes,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), fa = /*@__PURE__*/ M("$ZodCheckStartsWith", (e, t) => {
	N.init(e, t);
	let n = RegExp(`^${tr(t.prefix)}.*`);
	t.pattern ??= n, e._zod.check = (n) => {
		n.value.startsWith(t.prefix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: t.prefix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), pa = /*@__PURE__*/ M("$ZodCheckEndsWith", (e, t) => {
	N.init(e, t);
	let n = RegExp(`.*${tr(t.suffix)}$`);
	t.pattern ??= n, e._zod.check = (n) => {
		n.value.endsWith(t.suffix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: t.suffix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), ma = /*@__PURE__*/ M("$ZodCheckOverwrite", (e, t) => {
	N.init(e, t), e._zod.check = (e) => {
		e.value = t.tx(e.value);
	};
}), ha = class {
	constructor(e = [], t = {}) {
		this.content = [], this.indent = 0, this.args = e, this.closed = t;
	}
	indented(e) {
		this.indent += 1;
		try {
			e(this);
		} finally {
			--this.indent;
		}
	}
	write(e) {
		if (typeof e == "function") {
			e(this, { execution: "sync" }), e(this, { execution: "async" });
			return;
		}
		let t = e.split("\n").filter((e) => e), n = Math.min(...t.map((e) => e.length - e.trimStart().length)), r = t.map((e) => e.slice(n)).map((e) => " ".repeat(this.indent * 2) + e);
		for (let e of r) this.content.push(e);
	}
	compile() {
		let e = Function, t = this?.content ?? [""];
		return new e(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${t.join("\n")}\n};`)(...Object.values(this.closed));
	}
}, ga = {
	major: 4,
	minor: 6,
	patch: 5
}, I = /*@__PURE__*/ M("$ZodType", (e, t) => {
	var n;
	e ??= {}, e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = ga;
	let r = e._zod.def.checks, i = e._zod.traits.has("$ZodCheck") ? [e, ...r ?? []] : r?.length ? [...r] : [];
	for (let t of i) for (let n of t._zod.onattach) n(e);
	if (i.length === 0) (n = e._zod).deferred ?? (n.deferred = []), e._zod.deferred?.push(() => {
		e._zod.run = e._zod.parse;
	});
	else {
		let t = (t, n, r) => {
			if (t.memo) return t;
			let i = gr(t), a;
			for (let o of n) {
				if (o._zod.def.when) {
					if (_r(t) || !o._zod.def.when(t)) continue;
				} else if (i) continue;
				let n = t.issues.length, s = o._zod.check(t);
				if (s instanceof Promise && r?.async === !1) throw new Ur();
				if (a || s instanceof Promise) a = (a ?? Promise.resolve()).then(async () => {
					await s, t.issues.length !== n && (br(t.issues, n, e), i ||= gr(t, n));
				});
				else {
					if (t.issues.length === n) continue;
					br(t.issues, n, e), i ||= gr(t, n);
				}
			}
			return a ? a.then(() => t) : t;
		}, n = (n, r, a) => {
			if (gr(n)) return n.aborted = !0, n;
			let o = t(r, i, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new Ur();
				return o.then((t) => e._zod.parse(t, a));
			}
			return e._zod.parse(o, a);
		};
		e._zod.run = (r, a) => {
			if (a.skipChecks) return e._zod.parse(r, a);
			if (a.direction === "backward") {
				let t = e._zod.parse({
					value: r.value,
					issues: []
				}, {
					...a,
					skipChecks: !0
				});
				return t instanceof Promise ? t.then((e) => n(e, r, a)) : n(t, r, a);
			}
			let o = e._zod.parse(r, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new Ur();
				return o.then((e) => t(e, i, a));
			}
			return t(o, i, a);
		};
	}
}, {
	get "~standard"() {
		return kr(this, "~standard", ya(this));
	},
	set "~standard"(e) {
		Or(this, "~standard", e);
	}
}), _a = (e, t) => e.issues.length ? { issues: e.issues.map((e) => xr(e, t, Kr())) } : { value: e.value };
async function va(e, t) {
	let n = { async: !0 };
	return _a(await e._zod.run({
		value: t,
		issues: []
	}, n), n);
}
function ya(e) {
	return {
		validate: (t) => {
			let n = { async: !1 };
			try {
				let r = e._zod.run({
					value: t,
					issues: []
				}, n);
				if (!(r instanceof Promise)) return _a(r, n);
			} catch {}
			return va(e, t);
		},
		vendor: "zod",
		version: 1
	};
}
var ba = /*@__PURE__*/ M("$ZodString", (e, t) => {
	I.init(e, t), e._zod.pattern = t.pattern ?? Yi, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = String(n.value);
		} catch {}
		return typeof n.value == "string" || n.issues.push({
			expected: "string",
			code: "invalid_type",
			input: n.value,
			inst: e
		}), n;
	};
}), L = /*@__PURE__*/ M("$ZodStringFormat", (e, t) => {
	la.init(e, t), ba.init(e, t);
}), xa = /*@__PURE__*/ M("$ZodGUID", (e, t) => {
	t.pattern ??= Ai, L.init(e, t);
}), Sa = /*@__PURE__*/ M("$ZodUUID", (e, t) => {
	if (t.version) {
		let e = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[t.version];
		if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
		t.pattern ??= ji(e);
	} else t.pattern ??= ji();
	L.init(e, t);
}), Ca = /*@__PURE__*/ M("$ZodEmail", (e, t) => {
	t.pattern ??= Mi, L.init(e, t);
});
function wa(e) {
	try {
		return typeof URL < "u" && typeof URL.canParse == "function" ? URL.canParse(e) : (new URL(e), !0);
	} catch {
		return !1;
	}
}
function Ta(e, t) {
	return !("normalize" in t) && !("hostname" in t) && !("protocol" in t) ? wa(e) || 2 : Ea(e, t);
}
function Ea(e, t) {
	if (!t.normalize && t.protocol?.source === Vi.source && !/^https?:\/\//i.test(e)) return 1;
	try {
		if (typeof URL < "u") {
			let t = URL;
			if (typeof t.parse == "function") return t.parse(e) ?? 2;
		}
		return new URL(e);
	} catch {
		return 2;
	}
}
var Da = /[\t\n\r]/g;
function Oa(e) {
	return e.replace(Da, "");
}
function ka(e, t) {
	return t.lastIndex = 0, t.test(e.hostname);
}
function Aa(e, t) {
	return t.lastIndex = 0, t.test(e.protocol.endsWith(":") ? e.protocol.slice(0, -1) : e.protocol);
}
var ja = /*@__PURE__*/ M("$ZodURL", (e, t) => {
	L.init(e, t), e._zod.check = (n) => {
		try {
			let r = n.value.trim(), i = Ta(r, t);
			if (i === 1) {
				n.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: n.value,
					inst: e,
					continue: !t.abort
				});
				return;
			}
			if (i === 2) {
				n.issues.push({
					code: "invalid_format",
					format: "url",
					input: n.value,
					inst: e,
					continue: !t.abort
				});
				return;
			}
			if (i === !0) {
				n.value = Oa(r);
				return;
			}
			t.hostname && !ka(i, t.hostname) && n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: t.hostname.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			}), t.protocol && !Aa(i, t.protocol) && n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: t.protocol.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			}), n.value = t.normalize ? i.href : Oa(r);
			return;
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "url",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
}), Ma = /*@__PURE__*/ M("$ZodEmoji", (e, t) => {
	t.pattern ??= Pi(), L.init(e, t);
}), Na = /*@__PURE__*/ M("$ZodNanoID", (e, t) => {
	if (t.length !== void 0 && (!Number.isInteger(t.length) || t.length < 1)) throw Error(`Invalid nanoid length: ${t.length}`);
	t.pattern ??= t.length === void 0 ? Di : Oi(t.length), L.init(e, t);
}), Pa = /*@__PURE__*/ M("$ZodCUID", (e, t) => {
	t.pattern ??= Si, L.init(e, t);
}), Fa = /*@__PURE__*/ M("$ZodCUID2", (e, t) => {
	t.pattern ??= Ci, L.init(e, t);
}), Ia = /*@__PURE__*/ M("$ZodULID", (e, t) => {
	t.pattern ??= wi, L.init(e, t);
}), La = /*@__PURE__*/ M("$ZodXID", (e, t) => {
	t.pattern ??= Ti, L.init(e, t);
}), Ra = /*@__PURE__*/ M("$ZodKSUID", (e, t) => {
	t.pattern ??= Ei, L.init(e, t);
}), za = /*@__PURE__*/ M("$ZodISODateTime", (e, t) => {
	t.pattern ??= Ji(t), L.init(e, t);
}), Ba = /*@__PURE__*/ M("$ZodISODate", (e, t) => {
	t.pattern ??= Gi, L.init(e, t);
}), Va = /*@__PURE__*/ M("$ZodISOTime", (e, t) => {
	t.pattern ??= qi(t), L.init(e, t);
}), Ha = /*@__PURE__*/ M("$ZodISODuration", (e, t) => {
	t.pattern ??= ki, L.init(e, t);
}), Ua = /*@__PURE__*/ M("$ZodIPv4", (e, t) => {
	t.pattern ??= Fi, L.init(e, t);
}), Wa = /^[0-9a-fA-F:.]+$/;
function Ga(e) {
	return Wa.test(e) ? wa(`http://[${e}]`) : !1;
}
var Ka = /*@__PURE__*/ M("$ZodIPv6", (e, t) => {
	t.pattern ??= Ii, L.init(e, t), e._zod.check = (n) => {
		Ga(n.value) || n.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), qa = /*@__PURE__*/ M("$ZodCIDRv4", (e, t) => {
	t.pattern ??= Li, L.init(e, t);
});
function Ja(e) {
	let t = e.split("/");
	if (t.length !== 2) return !1;
	let [n, r] = t;
	if (!r) return !1;
	let i = Number(r);
	return `${i}` !== r || i < 0 || i > 128 ? !1 : Ga(n);
}
var Ya = /*@__PURE__*/ M("$ZodCIDRv6", (e, t) => {
	t.pattern ??= Ri, L.init(e, t), e._zod.check = (n) => {
		Ja(n.value) || n.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
});
function Xa(e) {
	if (e === "") return !0;
	if (/\s/.test(e) || e.length % 4 != 0) return !1;
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}
var Za = /^[0-9a-zA-Z+/]*={0,2}$/, Qa = /*@__PURE__*/ M("$ZodBase64", (e, t) => {
	t.pattern ??= Za, L.init(e, t), e._zod.check = (n) => {
		Xa(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), $a = /^[A-Za-z0-9_-]*$/;
function eo(e) {
	if (!$a.test(e)) return !1;
	let t = e.replace(/[-_]/g, (e) => e === "-" ? "+" : "/");
	return Xa(t.padEnd(Math.ceil(t.length / 4) * 4, "="));
}
var to = /*@__PURE__*/ M("$ZodBase64URL", (e, t) => {
	t.pattern ??= $a, L.init(e, t), e._zod.check = (n) => {
		eo(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), no = /*@__PURE__*/ M("$ZodE164", (e, t) => {
	t.pattern ??= Hi, L.init(e, t);
});
function ro(e, t = null) {
	try {
		let n = e.split(".");
		if (n.length !== 3) return !1;
		let [r] = n;
		if (!r) return !1;
		let i = JSON.parse(atob(r));
		return !("typ" in i && i?.typ !== "JWT" || !i.alg || t && (!("alg" in i) || i.alg !== t));
	} catch {
		return !1;
	}
}
var io = /*@__PURE__*/ M("$ZodJWT", (e, t) => {
	L.init(e, t), e._zod.check = (n) => {
		ro(n.value, t.alg) || n.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), ao = /*@__PURE__*/ M("$ZodNumber", (e, t) => {
	I.init(e, t), e._zod.pattern = Xi, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = Number(n.value);
		} catch {}
		let i = n.value;
		if (typeof i == "number" && !Number.isNaN(i) && Number.isFinite(i)) return n;
		let a = typeof i == "number" ? Number.isNaN(i) ? "NaN" : Number.isFinite(i) ? void 0 : String(i) : void 0;
		return n.issues.push({
			expected: "number",
			code: "invalid_type",
			input: i,
			inst: e,
			...a ? { received: a } : {}
		}), n;
	};
}), oo = /*@__PURE__*/ M("$ZodNumberFormat", (e, t) => {
	aa.init(e, t), ao.init(e, t);
}), so = /*@__PURE__*/ M("$ZodBoolean", (e, t) => {
	I.init(e, t), e._zod.pattern = Zi, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = !!n.value;
		} catch {}
		let i = n.value;
		return typeof i == "boolean" || n.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
	};
}), co = /*@__PURE__*/ M("$ZodUnknown", (e, t) => {
	I.init(e, t), e._zod.parse = (e) => e;
}), lo = /*@__PURE__*/ M("$ZodNever", (e, t) => {
	I.init(e, t), e._zod.parse = (t, n) => (t.issues.push({
		expected: "never",
		code: "invalid_type",
		input: t.value,
		inst: e
	}), t);
});
function uo(e, t, n) {
	e.issues.length && t.issues.push(...vr(n, e.issues)), t.value[n] = e.value;
}
var fo = /*@__PURE__*/ M("$ZodArray", (e, t) => {
	I.init(e, t);
	let n = Gr.memoizer;
	n?.attach(e), e._zod.parse = (r, i) => {
		let a = r.value;
		if (!Array.isArray(a)) return r.issues.push({
			expected: "array",
			code: "invalid_type",
			input: a,
			inst: e
		}), r;
		r.value = n ? n.alloc(e, r, Array(a.length), i) : Array(a.length);
		let o = [], s = i?.abortEarly;
		for (let e = 0; e < a.length; e++) {
			let n = a[e], c = t.element._zod.run({
				value: n,
				issues: []
			}, i);
			if (c instanceof Promise) o.push(c.then((t) => uo(t, r, e)));
			else if (uo(c, r, e), s && c.issues.length !== 0 && gr(c)) break;
		}
		return o.length ? Promise.all(o).then(() => r) : r;
	};
});
function po(e, t, n, r, i, a) {
	let o = n in r, s = a === "optional";
	if (o || !s || i !== "optional") {
		if (e.issues.length) {
			if (i !== void 0 && s && !o) return;
			t.issues.push(...vr(n, e.issues));
		}
		if (!o && i === void 0) {
			e.issues.length || t.issues.push({
				code: "invalid_type",
				expected: "nonoptional",
				input: void 0,
				path: [n]
			});
			return;
		}
		e.value === void 0 ? (o || i === "defaulted" && !s) && (t.value[n] = void 0) : t.value[n] = e.value;
	}
}
var mo = [];
function ho(e) {
	let t = Object.keys(e.shape), n = Object.getOwnPropertySymbols(e.shape), r = n.length ? n : mo, i = r.length ? [...t, ...r] : t;
	for (let t of i) if (!e.shape?.[t]?._zod?.traits?.has("$ZodType")) throw Error(`Invalid element at key "${String(t)}": expected a Zod schema`);
	let a = ir(e.shape);
	return {
		...e,
		allKeys: i,
		symbolKeys: r,
		keySet: new Set(t),
		numKeys: t.length,
		optionalKeys: new Set(a)
	};
}
function go(e, t, n, r, i, a, o) {
	let s = [], c = i.keySet, l = i.catchall._zod, u = l.def.type, d = l.optin, f = l.optout, p = 0;
	for (let i in t) {
		if (o && n.issues.length !== p) {
			if (gr(n, p)) break;
			p = n.issues.length;
		}
		if (c.has(i)) continue;
		if (i === "__proto__") {
			u === "never" && s.push(i);
			continue;
		}
		if (u === "never") {
			s.push(i);
			continue;
		}
		let a = l.run({
			value: t[i],
			issues: []
		}, r);
		a instanceof Promise ? e.push(a.then((e) => po(e, n, i, t, d, f))) : po(a, n, i, t, d, f);
	}
	return s.length && n.issues.push({
		code: "unrecognized_keys",
		keys: s,
		input: t,
		inst: a,
		continue: !0
	}), e.length ? Promise.all(e).then(() => n) : n;
}
var _o = /*@__PURE__*/ M("$ZodObject", (e, t) => {
	I.init(e, t);
	let n = Object.getOwnPropertyDescriptor(t, "shape"), r = n?.get ? n.get.raw : t.shape ?? {};
	if (r) {
		let e = () => {
			let n = { ...r };
			return Object.defineProperty(t, "shape", { value: n }), e.raw = n, n;
		};
		e.raw = r, Object.defineProperty(t, "shape", { get: e });
	}
	let i = Fn(() => ho(t));
	j(e, "propValues", (e) => {
		let t = e.def.shape, n = {};
		for (let e in t) {
			let r = t[e]._zod;
			if (r.values) {
				Object.prototype.hasOwnProperty.call(n, e) || zn(n, e, /* @__PURE__ */ new Set());
				for (let t of r.values) n[e].add(t);
				r.optin !== void 0 && n[e].add(void 0);
			}
		}
		return n;
	});
	let a = Xn, o = t.catchall, s, c = Gr.memoizer;
	c?.attach(e), e._zod.parse = (t, n) => {
		s ??= i.value;
		let r = t.value;
		if (!a(r)) return t.issues.push({
			expected: "object",
			code: "invalid_type",
			input: r,
			inst: e
		}), t;
		t.value = c ? c.alloc(e, t, {}, n) : {};
		let l = [], u = s.shape, d = n?.abortEarly, f = t.issues.length;
		for (let e of s.allKeys) {
			if (d && t.issues.length !== f) {
				if (gr(t, f)) break;
				f = t.issues.length;
			}
			if (e === "__proto__") continue;
			let i = u[e], a = i._zod.optin, o = i._zod.optout, s = i._zod.run({
				value: r[e],
				issues: []
			}, n);
			s instanceof Promise ? l.push(s.then((n) => po(n, t, e, r, a, o))) : po(s, t, e, r, a, o);
		}
		return o ? go(l, r, t, n, i.value, e, d === !0) : l.length ? Promise.all(l).then(() => t) : t;
	};
}), vo = /*@__PURE__*/ M("$ZodObjectJIT", (e, t) => {
	_o.init(e, t);
	let n = e._zod.parse, r = Fn(() => ho(t)), i = Gr.memoizer, a = (t) => {
		let n = r.value, a = n.symbolKeys, o = new ha(["payload", "ctx"], {
			shape: t,
			inst: e,
			memo: i,
			syms: a
		}), s = (e) => `shape[${e}]._zod.run({ value: input[${e}], issues: [] }, ctx)`, c = (e, t) => `
          let ${e}_ab = false;
          for (let i = 0; i < ${e}.issues.length; i++) {
            const iss = ${e}.issues[i];
            iss.path = iss.path ? [${t}, ...iss.path] : [${t}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${e}_ab = true;
          }
          if (${e}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		o.write("const input = payload.value;");
		let l = Object.create(null), u = 0;
		for (let e of n.allKeys) l[e] = `key_${u++}`;
		o.write(i ? "const newResult = memo.alloc(inst, payload, {}, ctx);" : "const newResult = {};");
		for (let e of n.allKeys) {
			if (e === "__proto__") continue;
			let n = l[e], r = typeof e == "symbol" ? `syms[${a.indexOf(e)}]` : qn(e), i = `${r} in input`, u = t[e], d = u?._zod?.optin, f = d !== void 0, p = u?._zod?.optout === "optional";
			if (o.write(`const ${n} = ${s(r)};`), f && p) {
				let e = d === "optional" ? `${n}_present` : `${n}.value !== undefined || ${n}_present`;
				o.write(`
        const ${n}_present = ${i};
        if (!${n}.issues.length || ${n}_present) {
          if (${n}.issues.length) {${c(n, r)}
          }

          if (${e}) {
            newResult[${r}] = ${n}.value;
          }
        }

      `);
			} else f ? (o.write(`
        if (${n}.issues.length) {${c(n, r)}
        }
      `), d === "defaulted" ? o.write(`newResult[${r}] = ${n}.value;`) : o.write(`
        if (${n}.value !== undefined || ${i}) {
          newResult[${r}] = ${n}.value;
        }
      `)) : o.write(`
        const ${n}_present = ${i};
        if (${n}.issues.length) {${c(n, r)}
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${r}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${n}_present) {
          newResult[${r}] = ${n}.value;
        }

      `);
		}
		return o.write("payload.value = newResult;"), o.write("return payload;"), o.compile();
	}, o, s = Xn, c = !Gr.jitless, l = c && Zn.value, u = t.catchall, d;
	e._zod.parse = (i, f) => {
		d ??= r.value;
		let p = i.value;
		return s(p) ? c && l && f?.async === !1 && f.jitless !== !0 ? (o ||= a(t.shape), i = o(i, f), u ? go([], p, i, f, d, e, f?.abortEarly === !0) : i) : n(i, f) : (i.issues.push({
			expected: "object",
			code: "invalid_type",
			input: p,
			inst: e
		}), i);
	};
});
function yo(e, t, n, r) {
	for (let n of e) if (n.issues.length === 0) return t.value = n.value, t;
	let i = e.filter((e) => !gr(e));
	return i.length === 1 ? (t.value = i[0].value, i[0]) : (t.issues.push({
		code: "invalid_union",
		input: t.value,
		inst: n,
		errors: e.map((e) => e.issues.map((e) => xr(e, r, Kr())))
	}), t);
}
var bo = /*@__PURE__*/ M("$ZodUnion", (e, t) => {
	I.init(e, t), j(e, "optin", (e) => e.def.options.some((e) => e._zod.optin === "defaulted") ? "defaulted" : e.def.options.some((e) => e._zod.optin !== void 0) ? "optional" : void 0), j(e, "optout", (e) => e.def.options.some((e) => e._zod.optout === "optional") ? "optional" : void 0), j(e, "values", (e) => {
		if (e.def.options.every((e) => e._zod.values)) return new Set(e.def.options.flatMap((e) => Array.from(e._zod.values)));
	}), j(e, "pattern", (e) => {
		if (e.def.options.every((e) => e._zod.pattern)) {
			let t = e.def.options.map((e) => e._zod.pattern);
			return RegExp(`^(${t.map((e) => Ln(e.source)).join("|")})$`);
		}
	});
	let n = t.options.length === 1 ? t.options[0]._zod.run : null;
	e._zod.parse = (r, i) => {
		if (n) return n(r, i);
		let a = !1, o = [];
		for (let e of t.options) {
			let t = e._zod.run({
				value: r.value,
				issues: []
			}, i);
			if (t instanceof Promise) o.push(t), a = !0;
			else {
				if (t.issues.length === 0) return t;
				o.push(t);
			}
		}
		return a ? Promise.all(o).then((t) => yo(t, r, e, i)) : yo(o, r, e, i);
	};
});
function xo(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.options) {
		let r = n._zod.propValues?.[e.discriminator];
		if (!r || r.size === 0) throw Error(`Invalid discriminated union option at index "${e.options.indexOf(n)}"`);
		for (let e of r) if (t.has(e)) {
			if (e !== void 0) throw Error(`Duplicate discriminator value "${String(e)}"`);
			t.set(e, null);
		} else t.set(e, n);
	}
	return t;
}
var So = /*@__PURE__*/ M("$ZodDiscriminatedUnion", (e, t) => {
	t.inclusive = !1, bo.init(e, t);
	let n = e._zod.parse;
	j(e, "propValues", (e) => {
		let t = {}, n = 0;
		for (let r of e.def.options) {
			let i = r._zod.propValues;
			if (!i || Object.keys(i).length === 0) throw Error(`Invalid discriminated union option at index "${e.def.options.indexOf(r)}"`);
			i[e.def.discriminator]?.has(void 0) && n++;
			for (let [e, n] of Object.entries(i)) {
				Object.prototype.hasOwnProperty.call(t, e) || zn(t, e, /* @__PURE__ */ new Set());
				for (let r of n) t[e].add(r);
			}
		}
		return !e.def.unionFallback && n > 1 && t[e.def.discriminator]?.delete(void 0), t;
	}), t.options.forEach((e, n) => {
		let r = Bn(e._zod.def);
		if (r && !Object.prototype.hasOwnProperty.call(r, t.discriminator)) throw Error(`Invalid discriminated union option at index "${n}"`);
	});
	let r = Fn(() => xo(t));
	e._zod.parse = (i, a) => {
		let o = i.value;
		if (!Xn(o)) return i.issues.push({
			code: "invalid_type",
			expected: "object",
			input: o,
			inst: e
		}), i;
		let s = o?.[t.discriminator], c = r.value.get(s);
		return c && (s !== void 0 || a.direction !== "backward") ? c._zod.run(i, a) : t.unionFallback || a.direction === "backward" ? n(i, a) : (i.issues.push({
			code: "invalid_union",
			errors: [],
			note: "No matching discriminator",
			discriminator: t.discriminator,
			options: Array.from(r.value.keys()).filter((e) => r.value.get(e) !== null),
			input: o,
			path: [t.discriminator],
			inst: e
		}), i);
	};
}), Co = /*@__PURE__*/ M("$ZodIntersection", (e, t) => {
	I.init(e, t), e._zod.parse = (e, n) => {
		let r = e.value, i = t.left._zod.run({
			value: r,
			issues: []
		}, n), a = t.right._zod.run({
			value: r,
			issues: []
		}, n);
		return i instanceof Promise || a instanceof Promise ? Promise.all([i, a]).then(([t, n]) => To(e, t, n)) : To(e, i, a);
	};
});
function wo(e, t) {
	if (e === t || e instanceof Date && t instanceof Date && +e == +t) return {
		valid: !0,
		data: e
	};
	if (Qn(e) && Qn(t)) {
		let n = Object.keys(t), r = Object.keys(e).filter((e) => n.indexOf(e) !== -1), i = {
			...e,
			...t
		};
		Object.prototype.hasOwnProperty.call(i, "__proto__") && delete i.__proto__;
		for (let n of r) {
			if (n === "__proto__") continue;
			let r = wo(e[n], t[n]);
			if (!r.valid) return {
				valid: !1,
				mergeErrorPath: [n, ...r.mergeErrorPath]
			};
			i[n] = r.data;
		}
		return {
			valid: !0,
			data: i
		};
	}
	if (Array.isArray(e) && Array.isArray(t)) {
		if (e.length !== t.length) return {
			valid: !1,
			mergeErrorPath: []
		};
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t[r], o = wo(i, a);
			if (!o.valid) return {
				valid: !1,
				mergeErrorPath: [r, ...o.mergeErrorPath]
			};
			n.push(o.data);
		}
		return {
			valid: !0,
			data: n
		};
	}
	return {
		valid: !1,
		mergeErrorPath: []
	};
}
function To(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i, a = /* @__PURE__ */ new Map(), o = (e, t) => {
		let n;
		if (e.code === "unrecognized_keys" && !e.path?.length) i ??= e, n = e.keys;
		else if (e.code === "invalid_key" && e.origin === "record" && e.path?.length === 1) {
			let t = String(e.path[0]);
			a.has(t) || a.set(t, e), n = [t];
		} else return !1;
		for (let e of n) r.has(e) || r.set(e, {}), r.get(e)[t] = !0;
		return !0;
	};
	for (let n of t.issues) o(n, "l") || e.issues.push(n);
	for (let t of n.issues) o(t, "r") || e.issues.push(t);
	let s = [...r].filter(([, e]) => e.l && e.r).map(([e]) => e);
	if (s.length) {
		let t = i ? s.filter((e) => i.keys.includes(e)) : [];
		t.length && e.issues.push({
			...i,
			keys: t
		});
		for (let n of s) !t.includes(n) && a.has(n) && e.issues.push(a.get(n));
	}
	let c = wo(t.value, n.value);
	if (!c.valid) {
		if (gr(e)) return e;
		throw Error(`Unmergable intersection. Error path: ${JSON.stringify(c.mergeErrorPath)}`);
	}
	return e.value = c.data, e;
}
var Eo = /*@__PURE__*/ M("$ZodEnum", (e, t) => {
	I.init(e, t);
	let n = jn(t.entries), r = new Set(n);
	e._zod.values = r, j(e, "pattern", (e) => {
		let t = jn(e.def.entries).filter((e) => er.has(typeof e));
		return RegExp(t.length ? `^(${t.map((e) => tr(e.toString())).join("|")})$` : "^[^\\s\\S]$");
	}), e._zod.parse = (t, i) => {
		let a = t.value;
		return r.has(a) || t.issues.push({
			code: "invalid_value",
			values: n,
			input: a,
			inst: e
		}), t;
	};
}), Do = /*@__PURE__*/ M("$ZodLiteral", (e, t) => {
	I.init(e, t);
	let n = new Set(t.values);
	e._zod.values = n, j(e, "pattern", (e) => {
		let t = e.def.values;
		return RegExp(t.length ? `^(${t.map((e) => typeof e == "string" ? tr(e) : e ? tr(e.toString()) : String(e)).join("|")})$` : "^[^\\s\\S]$");
	}), e._zod.parse = (r, i) => {
		let a = r.value;
		return n.has(a) || r.issues.push({
			code: "invalid_value",
			values: t.values,
			input: a,
			inst: e
		}), r;
	};
}), Oo = /*@__PURE__*/ M("$ZodTransform", (e, t) => {
	I.init(e, t), e._zod.optin = "optional", Gr.memoizer?.guard(e), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new Wr(e.constructor.name);
		let i = t.transform(n.value, n);
		if (r.async) return (i instanceof Promise ? i : Promise.resolve(i)).then((e) => (n.value = e, n));
		if (i instanceof Promise) throw new Ur();
		return n.value = i, n;
	};
});
function ko(e, t) {
	return e.value = t.issues.length ? void 0 : t.value, e;
}
var Ao = /*@__PURE__*/ M("$ZodOptional", (e, t) => {
	I.init(e, t), j(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), e._zod.optout = "optional", j(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? /* @__PURE__ */ new Set([...t, void 0]) : void 0;
	}), j(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${Ln(t.source)})?$`) : void 0;
	}), e._zod.parse = (e, n) => {
		if (e.value === void 0) {
			if (t.innerType._zod.optin !== "defaulted") return e;
			let r = t.innerType._zod.run({
				value: e.value,
				issues: []
			}, n);
			return r instanceof Promise ? r.then((t) => ko(e, t)) : ko(e, r);
		}
		return t.innerType._zod.run(e, n);
	};
}), jo = /*@__PURE__*/ M("$ZodExactOptional", (e, t) => {
	Ao.init(e, t), j(e, "values", (e) => e.def.innerType._zod.values), j(e, "pattern", (e) => e.def.innerType._zod.pattern), e._zod.parse = (e, n) => t.innerType._zod.run(e, n);
}), Mo = /*@__PURE__*/ M("$ZodNullable", (e, t) => {
	I.init(e, t), j(e, "optin", (e) => e.def.innerType._zod.optin), j(e, "optout", (e) => e.def.innerType._zod.optout), j(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${Ln(t.source)}|null)$`) : void 0;
	}), j(e, "values", (e) => e.def.innerType._zod.values ? /* @__PURE__ */ new Set([...e.def.innerType._zod.values, null]) : void 0), e._zod.parse = (e, n) => e.value === null ? e : t.innerType._zod.run(e, n);
}), No = /*@__PURE__*/ M("$ZodDefault", (e, t) => {
	I.init(e, t), e._zod.optin = "defaulted", j(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		if (e.value === void 0) return e.value = t.defaultValue, e;
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Po(e, t)) : Po(r, t);
	};
});
function Po(e, t) {
	return e.value === void 0 && (e.value = t.defaultValue), e;
}
var Fo = /*@__PURE__*/ M("$ZodPrefault", (e, t) => {
	I.init(e, t), e._zod.optin = "defaulted", j(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => (n.direction === "backward" || e.value === void 0 && (e.value = t.defaultValue), t.innerType._zod.run(e, n));
}), Io = /*@__PURE__*/ M("$ZodNonOptional", (e, t) => {
	I.init(e, t), j(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? new Set([...t].filter((e) => e !== void 0)) : void 0;
	}), e._zod.parse = (n, r) => {
		let i = t.innerType._zod.run(n, r);
		return i instanceof Promise ? i.then((t) => Lo(t, e)) : Lo(i, e);
	};
});
function Lo(e, t) {
	return !e.issues.length && e.value === void 0 && e.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: e.value,
		inst: t
	}), e;
}
function Ro(e, t, n, r) {
	return t.issues.length ? (e.value = n.catchValue({
		...t,
		value: e.value,
		error: { issues: t.issues.map((e) => xr(e, r, Kr())) },
		input: e.value
	}), e) : (e.value = t.value, t.memo && (e.memo = !0), e);
}
var zo = /*@__PURE__*/ M("$ZodCatch", (e, t) => {
	I.init(e, t), j(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), j(e, "optout", (e) => e.def.innerType._zod.optout), j(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run({
			value: e.value,
			issues: []
		}, n);
		return r instanceof Promise ? r.then((r) => Ro(e, r, t, n)) : Ro(e, r, t, n);
	};
}), Bo = /*@__PURE__*/ M("$ZodPipe", (e, t) => {
	I.init(e, t), j(e, "values", (e) => e.def.in._zod.values), j(e, "optin", (e) => e.def.in._zod.optin), j(e, "optout", (e) => e.def.out._zod.optout), j(e, "propValues", (e) => e.def.in._zod.propValues), e._zod.parse = (e, n) => {
		if (n.direction === "backward") {
			let r = t.out._zod.run(e, n);
			return r instanceof Promise ? r.then((e) => Vo(e, t.in, n)) : Vo(r, t.in, n);
		}
		let r = t.in._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Vo(e, t.out, n)) : Vo(r, t.out, n);
	};
});
function Vo(e, t, n) {
	return e.issues.some((e) => e.code !== "unrecognized_keys") ? (e.aborted = !0, e) : t._zod.run({
		value: e.value,
		issues: e.issues
	}, n);
}
var Ho = /*@__PURE__*/ M("$ZodReadonly", (e, t) => {
	I.init(e, t), j(e, "propValues", (e) => e.def.innerType._zod.propValues), j(e, "values", (e) => e.def.innerType._zod.values), j(e, "optin", (e) => e.def.innerType?._zod?.optin), j(e, "optout", (e) => e.def.innerType?._zod?.optout), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then(Uo) : Uo(r);
	};
});
function Uo(e) {
	return e.memo || (e.value = Object.freeze(e.value)), e;
}
var Wo = /*@__PURE__*/ M("$ZodCustom", (e, t) => {
	N.init(e, t), I.init(e, t), e._zod.parse = (e, t) => e, e._zod.check = (n) => {
		let r = n.value, i = t.fn(r);
		if (i instanceof Promise) return i.then((t) => Go(t, n, r, e));
		Go(i, n, r, e);
	};
});
function Go(e, t, n, r) {
	if (!e) {
		let e = {
			code: "custom",
			input: n,
			inst: r,
			path: [...r._zod.def.path ?? []],
			continue: !r._zod.def.abort
		};
		r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(Er(e));
	}
}
//#endregion
//#region node_modules/zod/v4/core/memoizer.js
var R = class extends Error {
	constructor() {
		super("Cannot parse a reference cycle that closes through a transform"), this.name = "ZodCyclicError";
	}
}, z = "~memo", Ko = [];
function qo(e) {
	return typeof e == "object" && !!e;
}
function Jo(e) {
	return e.map((e) => e.path ? {
		...e,
		path: e.path.slice()
	} : { ...e });
}
var Yo = /*@__PURE__*/ new WeakMap(), Xo = 0, Zo = 1, Qo = 2;
function $o(e, t, n) {
	let r = Yo.get(e);
	if (r !== void 0) return r ? Qo : Xo;
	if (t.has(e)) return Qo;
	t.add(e);
	let i = Xo, a = (e) => {
		if (i !== Qo && e?._zod) {
			let r = $o(e, t, n);
			r > i && (i = r);
		}
	}, o = (e, r) => {
		let i = Xo;
		for (let a of Reflect.ownKeys(e)) {
			let o = Object.getOwnPropertyDescriptor(e, a);
			if (r && !o.enumerable) continue;
			let s = o.get ? Zo : o.value?._zod ? $o(o.value, t, n) : Xo;
			s > i && (i = s);
		}
		return i;
	}, s = (e) => {
		e > i && (i = e);
	}, c = e._zod.def;
	switch (c.type) {
		case "object": {
			let e = Bn(c);
			s(e ? o(e, !0) : Zo), a(c.catchall);
			break;
		}
		case "array":
			a(c.element);
			break;
		case "tuple":
			for (let e of c.items) a(e);
			a(c.rest);
			break;
		case "record":
		case "map":
			a(c.keyType), a(c.valueType);
			break;
		case "set":
			a(c.valueType);
			break;
		case "union":
			for (let e of c.options) a(e);
			break;
		case "intersection":
			a(c.left), a(c.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			a(c.innerType);
			break;
		case "pipe":
			a(c.in), a(c.out);
			break;
		case "function":
			a(c.input), a(c.output);
			break;
		case "lazy": {
			let r = c._cachedInner ?? (n ? e._zod.innerType : void 0);
			s(r ? $o(r, t, !1) : Zo);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (let e in c) {
			let t = Object.getOwnPropertyDescriptor(c, e);
			if (!t || t.get) continue;
			let n = t.value;
			if (n && typeof n == "object") {
				if (n._zod) a(n);
				else if (Array.isArray(n)) for (let e of n) a(e);
			}
		}
	}
	return t.delete(e), es(e, i);
}
function es(e, t) {
	return t !== Zo && Yo.set(e, t === Qo), t;
}
function ts(e, t) {
	let n = e.buckets.get(t);
	return n || (n = /* @__PURE__ */ new WeakMap(), e.buckets.set(t, n)), n;
}
var ns, rs = [], is = {
	alloc(e, t, n) {
		let r = ns;
		if (!r) return n;
		ns = void 0;
		let i = {
			value: n,
			issues: null
		};
		return r.set(t.value, i), rs.push(i), n;
	},
	guard(e) {
		var t;
		(t = e._zod).deferred ?? (t.deferred = []), e._zod.deferred.push(() => {
			let t = e._zod.parse, n = (e, n) => {
				if (n.direction !== "backward" && os(n, e.value)) throw new R();
				return t(e, n);
			};
			e._zod.parse = n, e._zod.run === t && (e._zod.run = n);
		});
	},
	attach(e) {
		var t;
		let n, r = !1, i, a;
		(t = e._zod).deferred ?? (t.deferred = []), e._zod.deferred.push(() => {
			let t = e._zod.parse, o = (s, c) => {
				if (n === void 0) {
					let i = $o(e, /* @__PURE__ */ new Set(), !1);
					if (i === Xo) return e._zod.parse = t, e._zod.run === o && (e._zod.run = t), t(s, c);
					i === Qo || r ? n = !0 : r = !0;
				}
				let l = s.value;
				if (!qo(l)) return t(s, c);
				let u = c[z];
				u || (u = {
					buckets: /* @__PURE__ */ new WeakMap(),
					backEdges: void 0
				}, c[z] = u);
				let d;
				i === c ? d = a : (d = ts(u, e), i = c, a = d);
				let f = d.get(l);
				if (f) return s.value = f.value, f.issues ? f.issues.length && s.issues.push(...Jo(f.issues)) : (s.memo = !0, u.backEdges ?? (u.backEdges = /* @__PURE__ */ new WeakSet()), u.backEdges.add(f.value)), s;
				ns = d;
				let p = rs.length, m = t(s, c);
				ns = void 0;
				let h = rs.length > p ? rs.pop() : void 0;
				return m instanceof Promise ? m.then((e) => (h && (h.issues = e.issues.length ? Jo(e.issues) : Ko), e)) : (h && (h.issues = m.issues.length ? Jo(m.issues) : Ko), m);
			};
			e._zod.parse = o, e._zod.run === t && (e._zod.run = o);
		});
	}
};
function as() {
	return is;
}
function os(e, t) {
	let n = e[z]?.backEdges;
	return n !== void 0 && qo(t) && n.has(t);
}
//#endregion
//#region node_modules/zod/v4/locales/en.js
var ss = () => {
	let e = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function t(t) {
		return e[t] ?? null;
	}
	let n = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	}, r = { nan: "NaN" };
	function i(e, t) {
		return e === "number" && typeof t == "number" && !Number.isFinite(t) ? String(t) : r[e] ?? e;
	}
	return (e) => {
		switch (e.code) {
			case "invalid_type": return `Invalid input: expected ${i(e.expected)}, received ${i(Tr(e.input), e.input)}`;
			case "invalid_value": return e.values.length === 1 ? `Invalid input: expected ${rr(e.values[0])}` : `Invalid option: expected one of ${Mn(e.values, "|")}`;
			case "too_big": {
				let n = e.exact ? "exactly " : e.inclusive ? "<=" : "<", r = t(e.origin);
				return r ? `Too big: expected ${e.origin ?? "value"} to have ${n}${e.maximum.toString()} ${r.unit ?? "elements"}` : `Too big: expected ${e.origin ?? "value"} to be ${n}${e.maximum.toString()}`;
			}
			case "too_small": {
				let n = e.exact ? "exactly " : e.inclusive ? ">=" : ">", r = t(e.origin);
				return r ? `Too small: expected ${e.origin} to have ${n}${e.minimum.toString()} ${r.unit}` : `Too small: expected ${e.origin} to be ${n}${e.minimum.toString()}`;
			}
			case "invalid_format": {
				let t = e;
				return t.format === "starts_with" ? `Invalid string: must start with "${t.prefix}"` : t.format === "ends_with" ? `Invalid string: must end with "${t.suffix}"` : t.format === "includes" ? `Invalid string: must include "${t.includes}"` : t.format === "regex" ? `Invalid string: must match pattern ${t.pattern}` : `Invalid ${n[t.format] ?? e.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${e.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${e.keys.length > 1 ? "s" : ""}: ${Mn(e.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${e.origin}`;
			case "invalid_union": return e.options && Array.isArray(e.options) && e.options.length > 0 ? `Invalid discriminator value. Expected ${e.options.map((e) => `'${e}'`).join(" | ")}` : e.inclusive === !1 ? "Invalid input: more than one option matched" : "Invalid input";
			case "invalid_element": return `Invalid value in ${e.origin}`;
			default: return "Invalid input";
		}
	};
};
function cs() {
	return { localeError: ss() };
}
//#endregion
//#region node_modules/zod/v4/core/registries.js
var ls, us = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map();
	}
	add(e, ...t) {
		let n = t[0];
		return this._map.set(e, n), n && typeof n == "object" && "id" in n && this._idmap.set(n.id, e), this;
	}
	clear() {
		return this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map(), this;
	}
	remove(e) {
		let t = this._map.get(e);
		return t && typeof t == "object" && "id" in t && this._idmap.delete(t.id), this._map.delete(e), this;
	}
	get(e) {
		let t = e._zod.parent;
		if (t) {
			let n = { ...this.get(t) ?? {} };
			delete n.id;
			let r = {
				...n,
				...this._map.get(e)
			};
			return Object.keys(r).length ? r : void 0;
		}
		return this._map.get(e);
	}
	has(e) {
		return this._map.has(e);
	}
};
function ds() {
	return new us();
}
(ls = globalThis).__zod_globalRegistry ?? (ls.__zod_globalRegistry = ds());
var fs = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/zod/v4/core/api.js
function ps(e) {
	return e.checks &&= [...e.checks], e;
}
// @__NO_SIDE_EFFECTS__
function ms(e, t) {
	return new e(ps({
		type: "string",
		...A(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function hs(e, t) {
	return new e({
		type: "string",
		format: "email",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function gs(e, t) {
	return new e({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function _s(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function vs(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v4",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ys(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v6",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function bs(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v7",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function xs(e, t) {
	return new e({
		type: "string",
		format: "url",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ss(e, t) {
	return new e({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Cs(e, t) {
	return new e({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ws(e, t) {
	return new e({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ts(e, t) {
	return new e({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Es(e, t) {
	return new e({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ds(e, t) {
	return new e({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Os(e, t) {
	return new e({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ks(e, t) {
	return new e({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function As(e, t) {
	return new e({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function js(e, t) {
	return new e({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ms(e, t) {
	return new e({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ns(e, t) {
	return new e({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ps(e, t) {
	return new e({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Fs(e, t) {
	return new e({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Is(e, t) {
	return new e({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ls(e, t) {
	return new e({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: !1,
		local: !1,
		precision: null,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Rs(e, t) {
	return new e({
		type: "string",
		format: "date",
		check: "string_format",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function zs(e, t) {
	return new e({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Bs(e, t) {
	return new e({
		type: "string",
		format: "duration",
		check: "string_format",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Vs(e, t) {
	return new e(ps({
		type: "number",
		checks: [],
		...A(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function Hs(e, t) {
	return new e({
		type: "number",
		check: "number_format",
		abort: !1,
		format: "safeint",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Us(e, t) {
	return new e({
		type: "boolean",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ws(e) {
	return new e({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function Gs(e, t) {
	return new e({
		type: "never",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ks(e, t) {
	return new na({
		check: "less_than",
		...A(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function qs(e, t) {
	return new na({
		check: "less_than",
		...A(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function Js(e, t) {
	return new ra({
		check: "greater_than",
		...A(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function Ys(e, t) {
	return new ra({
		check: "greater_than",
		...A(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function Xs(e, t) {
	return new ia({
		check: "multiple_of",
		...A(t),
		value: e
	});
}
// @__NO_SIDE_EFFECTS__
function Zs(e, t) {
	return new oa({
		check: "max_length",
		...A(t),
		maximum: e
	});
}
// @__NO_SIDE_EFFECTS__
function Qs(e, t) {
	return new sa({
		check: "min_length",
		...A(t),
		minimum: e
	});
}
// @__NO_SIDE_EFFECTS__
function $s(e, t) {
	return new ca({
		check: "length_equals",
		...A(t),
		length: e
	});
}
// @__NO_SIDE_EFFECTS__
function ec(e, t) {
	return new P({
		check: "string_format",
		format: "regex",
		...A(t),
		pattern: e
	});
}
// @__NO_SIDE_EFFECTS__
function tc(e) {
	return new F({
		check: "string_format",
		format: "lowercase",
		...A(e)
	});
}
// @__NO_SIDE_EFFECTS__
function nc(e) {
	return new ua({
		check: "string_format",
		format: "uppercase",
		...A(e)
	});
}
// @__NO_SIDE_EFFECTS__
function rc(e, t) {
	return new da({
		check: "string_format",
		format: "includes",
		...A(t),
		includes: e
	});
}
// @__NO_SIDE_EFFECTS__
function ic(e, t) {
	return new fa({
		check: "string_format",
		format: "starts_with",
		...A(t),
		prefix: e
	});
}
// @__NO_SIDE_EFFECTS__
function ac(e, t) {
	return new pa({
		check: "string_format",
		format: "ends_with",
		...A(t),
		suffix: e
	});
}
// @__NO_SIDE_EFFECTS__
function oc(e) {
	return new ma({
		check: "overwrite",
		tx: e
	});
}
// @__NO_SIDE_EFFECTS__
function sc(e) {
	return /* @__PURE__ */ oc((t) => t.normalize(e));
}
// @__NO_SIDE_EFFECTS__
function cc() {
	return /* @__PURE__ */ oc((e) => e.trim());
}
// @__NO_SIDE_EFFECTS__
function lc() {
	return /* @__PURE__ */ oc((e) => e.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function uc() {
	return /* @__PURE__ */ oc((e) => e.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function dc() {
	return /* @__PURE__ */ oc((e) => Jn(e));
}
// @__NO_SIDE_EFFECTS__
function fc(e, t, n) {
	return new e({
		type: "array",
		element: t,
		...A(n)
	});
}
// @__NO_SIDE_EFFECTS__
function pc(e, t, n) {
	return new e({
		type: "custom",
		check: "custom",
		fn: t,
		...A(n)
	});
}
// @__NO_SIDE_EFFECTS__
function mc(e, t) {
	let n = /* @__PURE__ */ hc((t) => (t.addIssue = (e) => {
		if (typeof e == "string") t.issues.push(Er(e, t.value, n._zod.def));
		else {
			let r = e;
			r.fatal && (r.continue = !1), r.code ??= "custom", "input" in r || (r.input = t.value), r.inst ??= n, r.continue ??= !n._zod.def.abort, t.issues.push(Er(r));
		}
	}, e(t.value, t)), t);
	return n;
}
// @__NO_SIDE_EFFECTS__
function hc(e, t) {
	let n = new N({
		check: "custom",
		...A(t)
	});
	return n._zod.check = e, n;
}
//#endregion
//#region node_modules/zod/v4/core/to-json-schema.js
function gc(e, ...t) {
	for (let n of t) for (let t of Reflect.ownKeys(n)) Object.prototype.propertyIsEnumerable.call(n, t) && zn(e, t, n[t]);
	return e;
}
function _c(e) {
	let t = e?.target ?? "draft-2020-12";
	return t === "draft-4" && (t = "draft-04"), t === "draft-7" && (t = "draft-07"), {
		processors: e.processors ?? {},
		metadataRegistry: e?.metadata ?? fs,
		target: t,
		unrepresentable: e?.unrepresentable ?? "throw",
		override: e?.override ?? (() => {}),
		io: e?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: e?.cycles ?? "ref",
		reused: e?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: e?.external ?? void 0
	};
}
function vc(e, t, n, r, i) {
	let a = typeof t.unrepresentable == "function" ? t.unrepresentable({
		zodSchema: e,
		path: r.path,
		message: i
	}) : t.unrepresentable;
	if (a === "any") return !1;
	if (a === void 0 || a === "throw") throw Error(i);
	return Object.assign(n, a), !0;
}
function yc(e, t, n = {
	path: [],
	schemaPath: []
}) {
	var r;
	let i = e._zod.def, a = t.seen.get(e);
	if (a) return a.count++, n.schemaPath.includes(e) && (a.cycle = n.path), a.schema;
	let o = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: n.path
	};
	t.seen.set(e, o), t.sharedDefsExtractedFor = void 0, t.sharedEmitDoneFor = void 0;
	let s = e._zod.toJSONSchema?.();
	if (s) o.schema = s;
	else {
		let r = {
			...n,
			schemaPath: [...n.schemaPath, e],
			path: n.path
		};
		if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, r);
		else {
			let n = o.schema, a = t.processors[i.type];
			if (!a) throw Error(`[toJSONSchema]: Non-representable type encountered: ${i.type}`);
			a(e, t, n, r);
		}
		let a = e._zod.parent;
		a && (o.ref ||= a, yc(a, t, r), t.seen.get(a).isParent = !0);
	}
	let c = t.metadataRegistry.get(e);
	return c && gc(o.schema, c), t.io === "input" && kc(e) && (delete o.schema.examples, delete o.schema.default), t.io === "input" && "_prefault" in o.schema && ((r = o.schema).default ?? (r.default = o.schema._prefault)), delete o.schema._prefault, t.seen.get(e).schema;
}
function bc(e) {
	return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
function xc(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	if (e.external && e.sharedDefsExtractedFor === e.external) return;
	let r = /* @__PURE__ */ new Map();
	for (let t of e.seen.entries()) {
		let n = e.metadataRegistry.get(t[0])?.id;
		if (n) {
			let e = r.get(n);
			if (e && e !== t[0]) throw Error(`Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			r.set(n, t[0]);
		}
	}
	let i = (t) => {
		let r = e.target === "draft-2020-12" ? "$defs" : "definitions";
		if (e.external) {
			let n = e.external.registry.get(t[0])?.id, i = e.external.uri ?? ((e) => e);
			if (n) return { ref: i(n) };
			let a = t[1].defId ?? t[1].schema.id ?? `schema${e.counter++}`;
			return t[1].defId = a, {
				defId: a,
				ref: `${i("__shared")}#/${r}/${bc(a)}`
			};
		}
		let i = `#/${r}/`;
		if (t[1] === n && !t[1].schema.id) return { ref: "#" };
		let a = t[1].schema.id ?? `__schema${e.counter++}`;
		return {
			defId: a,
			ref: i + bc(a)
		};
	}, a = (e) => {
		if (e[1].schema.$ref) return;
		let t = e[1], { ref: n, defId: r } = i(e);
		t.def = { ...t.schema }, r && (t.defId = r);
		let a = t.schema;
		for (let e in a) delete a[e];
		a.$ref = n;
	};
	if (e.cycles === "throw") for (let t of e.seen.entries()) {
		let e = t[1];
		if (e.cycle) throw Error(`Cycle detected: #/${e.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (let n of e.seen.entries()) {
		let r = n[1];
		if (t === n[0]) {
			a(n);
			continue;
		}
		if (e.external) {
			let r = e.external.registry.get(n[0])?.id;
			if (t !== n[0] && r) {
				a(n);
				continue;
			}
		}
		if (e.metadataRegistry.get(n[0])?.id) {
			a(n);
			continue;
		}
		if (r.cycle) {
			a(n);
			continue;
		}
		r.count > 1 && e.reused === "ref" && a(n);
	}
	e.external && (e.sharedDefsExtractedFor = e.external);
}
function Sc(e) {
	let t = e.anyOf;
	if (!Array.isArray(t) || t.length === 0 || e.type !== void 0) return;
	let n = [];
	for (let e of t) {
		if (!e || typeof e != "object") return;
		Sc(e);
		let t = Object.keys(e);
		if (t.length !== 1 || t[0] !== "type") return;
		let r = e.type;
		for (let e of Array.isArray(r) ? r : [r]) {
			if (typeof e != "string") return;
			n.includes(e) || n.push(e);
		}
	}
	delete e.anyOf, e.type = n.length === 1 ? n[0] : n;
}
var Cc = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]), wc = ["oneOf", "anyOf"];
function Tc(e) {
	let t = e.additionalProperties;
	return t === void 0 || t === !1 || typeof t != "object" || !t ? null : Object.keys(t).length ? t : null;
}
function Ec(e) {
	let t = [];
	for (let n of e) {
		if (typeof n != "object" || n.type !== "object") return null;
		for (let e in n) if (!Cc.has(e)) return null;
		t.push(n);
	}
	let n = {}, r = /* @__PURE__ */ new Set();
	for (let e of t) {
		for (let r in e.properties) {
			if (Object.prototype.hasOwnProperty.call(n, r)) continue;
			let e = [];
			for (let n of t) {
				let t = n.properties?.[r] ?? Tc(n);
				t != null && (e.some((e) => JSON.stringify(e) === JSON.stringify(t)) || e.push(t));
			}
			zn(n, r, e.length === 1 ? e[0] : Ec(e) ?? { allOf: e });
		}
		for (let t of e.required ?? []) r.add(t);
	}
	let i = {
		type: "object",
		properties: n
	};
	if (r.size && (i.required = [...r]), t.every((e) => e.additionalProperties === !1)) i.additionalProperties = !1;
	else {
		let e = [];
		for (let n of t) {
			let t = Tc(n);
			t && !e.some((e) => JSON.stringify(e) === JSON.stringify(t)) && e.push(t);
		}
		e.length === 1 ? i.additionalProperties = e[0] : e.length > 1 && (i.additionalProperties = { allOf: e });
	}
	return i;
}
function Dc(e) {
	let t = e.allOf;
	if (!Array.isArray(t) || t.length < 2) return;
	for (let t of Cc) if (t in e) return;
	let n = t.filter((e) => wc.some((t) => Array.isArray(e[t]))), r = null;
	if (!n.length) r = Ec(t);
	else {
		let e = n[0], i = wc.find((t) => Array.isArray(e[t]));
		if (Object.keys(e).length !== 1) return;
		let a = t.filter((t) => t !== e), o = e[i].map((e) => Ec([...a, e]));
		if (o.some((e) => !e)) return;
		r = { [i]: o };
	}
	r && (delete e.allOf, gc(e, r));
}
function Oc(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	let r = (t) => {
		let n = e.seen.get(t);
		if (n.ref === null) return;
		let i = n.def ?? n.schema, a = { ...i }, o = n.ref;
		if (n.ref = null, o) {
			r(o);
			let n = e.seen.get(o), s = n.schema;
			if (s.$ref && (e.target === "draft-07" || e.target === "draft-04" || e.target === "openapi-3.0") ? (i.allOf = i.allOf ?? [], i.allOf.push(s)) : gc(i, s), gc(i, a), t._zod.parent === o) for (let e in i) e !== "$ref" && e !== "allOf" && (e in a || delete i[e]);
			if (s.$ref && n.def) for (let e in i) e !== "$ref" && e !== "allOf" && e in n.def && JSON.stringify(i[e]) === JSON.stringify(n.def[e]) && delete i[e];
		}
		let s = t._zod.parent;
		if (s && s !== o) {
			r(s);
			let t = e.seen.get(s);
			if (t?.schema.$ref && (i.$ref = t.schema.$ref, t.def)) for (let e in i) e !== "$ref" && e !== "allOf" && e in t.def && JSON.stringify(i[e]) === JSON.stringify(t.def[e]) && delete i[e];
		}
		e.override({
			zodSchema: t,
			jsonSchema: i,
			path: n.path ?? []
		});
	};
	if (!e.external || e.sharedEmitDoneFor !== e.external) {
		for (let t of [...e.seen.entries()].reverse()) r(t[0]);
		if (e.target !== "openapi-3.0") for (let t of e.seen.entries()) Sc(t[1].def ?? t[1].schema);
		for (let t of e.deferred) t();
		if (e.intersections.length) {
			let t = /* @__PURE__ */ new Map();
			for (let n of e.seen.values()) for (let e of [n.schema, n.def]) {
				let n = e?.allOf;
				if (!Array.isArray(n)) continue;
				let r = t.get(n);
				r ? r.push(e) : t.set(n, [e]);
			}
			for (let n of e.intersections) for (let e of t.get(n) ?? []) Dc(e);
		}
	}
	let i = {};
	if (e.target === "draft-2020-12" ? i.$schema = "https://json-schema.org/draft/2020-12/schema" : e.target === "draft-07" ? i.$schema = "http://json-schema.org/draft-07/schema#" : e.target === "draft-04" ? i.$schema = "http://json-schema.org/draft-04/schema#" : e.target, e.external?.uri) {
		let n = e.external.registry.get(t)?.id;
		if (!n) throw Error("Schema is missing an `id` property");
		i.$id = e.external.uri(n);
	}
	gc(i, n.defId ? n.schema : n.def ?? n.schema);
	let a = e.metadataRegistry.get(t)?.id;
	a !== void 0 && i.id === a && delete i.id;
	let o = e.external?.defs ?? {};
	if (!e.external || e.sharedEmitDoneFor !== e.external) for (let t of e.seen.entries()) {
		let e = t[1];
		e.def && e.defId && (e.def.id === e.defId && delete e.def.id, zn(o, e.defId, e.def));
	}
	e.external && (e.sharedEmitDoneFor = e.external), e.external || Object.keys(o).length > 0 && (e.target === "draft-2020-12" ? i.$defs = o : i.definitions = o);
	try {
		let n = JSON.parse(JSON.stringify(i));
		return Object.defineProperty(n, "~standard", {
			value: {
				...t["~standard"],
				jsonSchema: {
					input: jc(t, "input", e.processors),
					output: jc(t, "output", e.processors)
				}
			},
			enumerable: !1,
			writable: !1
		}), n;
	} catch {
		throw Error("Error converting schema to JSON.");
	}
}
function kc(e, t) {
	let n = t ?? { seen: /* @__PURE__ */ new Set() };
	if (n.seen.has(e)) return !1;
	n.seen.add(e);
	let r = e._zod.def;
	if (r.type === "transform") return !0;
	if (r.type === "array") return kc(r.element, n);
	if (r.type === "set") return kc(r.valueType, n);
	if (r.type === "lazy") return kc(r.getter(), n);
	if (r.type === "promise" || r.type === "optional" || r.type === "nonoptional" || r.type === "nullable" || r.type === "readonly" || r.type === "default" || r.type === "prefault" || r.type === "catch") return kc(r.innerType, n);
	if (r.type === "intersection") return kc(r.left, n) || kc(r.right, n);
	if (r.type === "record" || r.type === "map") return kc(r.keyType, n) || kc(r.valueType, n);
	if (r.type === "pipe") return e._zod.traits.has("$ZodCodec") ? !0 : kc(r.in, n) || kc(r.out, n);
	if (r.type === "object") {
		for (let e in r.shape) if (kc(r.shape[e], n)) return !0;
		return !1;
	}
	if (r.type === "union") {
		for (let e of r.options) if (kc(e, n)) return !0;
		return !1;
	}
	if (r.type === "tuple") {
		for (let e of r.items) if (kc(e, n)) return !0;
		return !!(r.rest && kc(r.rest, n));
	}
	return !1;
}
var Ac = (e, t = {}) => (n) => {
	let r = _c({
		...n,
		processors: t
	});
	return yc(e, r), xc(r, e), Oc(r, e);
}, jc = (e, t, n = {}) => (r) => {
	let { libraryOptions: i, target: a } = r ?? {}, o = _c({
		...i ?? {},
		target: a,
		io: t,
		processors: n
	});
	return yc(e, o), xc(o, e), Oc(o, e);
}, Mc = (e, t, n) => {
	(e[t] === void 0 || n > e[t]) && (e[t] = n);
}, Nc = (e, t, n) => {
	(e[t] === void 0 || n < e[t]) && (e[t] = n);
}, Pc = (e, t) => {
	Mc(e, "minimum", t), Nc(e, "maximum", t);
}, Fc = (e, t) => {
	e.multipleOf ??= [], e.multipleOf.includes(t) || e.multipleOf.push(t);
}, Ic = (e, t) => {
	e.patterns ??= /* @__PURE__ */ new Set(), e.patterns.add(t);
}, Lc = (e, t) => {
	e.mime = e.mime ? e.mime.filter((e) => t.includes(e)) : [...t];
}, Rc = (e, t) => {
	e.format = t, t.includes("int") && (e.isInt = !0);
}, zc = (e, t) => Mc(e, "minimum", t.minimum), Bc = (e, t) => Nc(e, "maximum", t.maximum), Vc = (e) => (t, n) => {
	Rc(t, n.format);
	let [r, i] = e[n.format];
	Mc(t, "minimum", r), Nc(t, "maximum", i);
}, Hc = {
	greater_than: (e, t) => Mc(e, t.inclusive ? "minimum" : "exclusiveMinimum", t.value),
	less_than: (e, t) => Nc(e, t.inclusive ? "maximum" : "exclusiveMaximum", t.value),
	multiple_of: (e, t) => Fc(e, t.value),
	number_format: Vc(ar),
	bigint_format: Vc(or),
	min_length: zc,
	max_length: Bc,
	length_equals: (e, t) => Pc(e, t.length),
	min_size: zc,
	max_size: Bc,
	size_equals: (e, t) => Pc(e, t.size),
	string_format: (e, t) => {
		Rc(e, t.format), t.pattern && Ic(e, t.pattern), (t.format === "base64" || t.format === "base64url") && (e.contentEncoding = t.format), (t.local || t.precision === -1) && (e.laxFormat = !0);
	},
	mime_type: (e, t) => Lc(e, t.mime)
};
function Uc(e) {
	let t = {}, n = e._zod.def, r = e._zod.traits.has("$ZodCheck") ? [e, ...n.checks ?? []] : n.checks ?? [];
	for (let e of r) Hc[e._zod.def.check]?.(t, e._zod.def);
	let i = e._zod.bag;
	i.minimum !== void 0 && Mc(t, "minimum", i.minimum), i.exclusiveMinimum !== void 0 && Mc(t, "exclusiveMinimum", i.exclusiveMinimum), i.maximum !== void 0 && Nc(t, "maximum", i.maximum), i.exclusiveMaximum !== void 0 && Nc(t, "exclusiveMaximum", i.exclusiveMaximum), i.multipleOf !== void 0 && Fc(t, i.multipleOf), i.format !== void 0 && (t.format ??= i.format, i.format.includes("int") && (t.isInt = !0)), i.mime && Lc(t, i.mime);
	for (let e of i.patterns ?? []) Ic(t, e);
	return t;
}
var Wc = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
}, Gc = /* @__PURE__ */ new Map([[Za, zi], [$a, Bi]]), Kc = (e) => Gc.get(e) ?? e, qc = (e, t, n, r) => {
	let i = n;
	i.type = "string";
	let { minimum: a, maximum: o, format: s, patterns: c, contentEncoding: l, laxFormat: u } = Uc(e);
	if (typeof a == "number" && (i.minLength = a), typeof o == "number" && (i.maxLength = o), s && (i.format = Wc[s] ?? s, i.format === "" && delete i.format, (s === "time" || u) && delete i.format), l && (i.contentEncoding = l), c && c.size > 0) {
		let e = [...c].map(Kc);
		e.length === 1 ? i.pattern = e[0].source : e.length > 1 && (i.allOf = [...e.map((e) => ({
			...t.target === "draft-07" || t.target === "draft-04" || t.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: e.source
		}))]);
	}
}, Jc = (e, t, n, r) => {
	let i = n, { minimum: a, maximum: o, multipleOf: s, exclusiveMaximum: c, exclusiveMinimum: l, isInt: u } = Uc(e);
	i.type = u ? "integer" : "number";
	let d = typeof l == "number" && l >= (a ?? -Infinity), f = typeof c == "number" && c <= (o ?? Infinity), p = t.target === "draft-04" || t.target === "openapi-3.0";
	if (d ? p ? (i.minimum = l, i.exclusiveMinimum = !0) : i.exclusiveMinimum = l : typeof a == "number" && (i.minimum = a), f ? p ? (i.maximum = c, i.exclusiveMaximum = !0) : i.exclusiveMaximum = c : typeof o == "number" && (i.maximum = o), s) {
		let n = /* @__PURE__ */ new Set();
		for (let a of s) Number.isFinite(a) && a !== 0 ? n.add(Math.abs(a)) : vc(e, t, i, r, `A multipleOf divisor of ${a} cannot be represented in JSON Schema`);
		let [a, ...o] = n;
		a !== void 0 && (i.multipleOf = a), o.length && (i.allOf = [...i.allOf ?? [], ...o.map((e) => ({ multipleOf: e }))]);
	}
}, Yc = (e, t, n, r) => {
	n.type = "boolean";
}, Xc = (e, t, n, r) => {
	n.not = {};
}, Zc = (e, t, n, r) => {
	let i = e._zod.def, a = jn(i.entries);
	if (a.length === 0) {
		n.not = {};
		return;
	}
	a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), n.enum = a;
}, Qc = (e, t, n, r) => {
	let i = e._zod.def;
	if (i.values.length === 0) {
		n.not = {};
		return;
	}
	let a = [];
	for (let o of i.values) if (o === void 0) {
		if (vc(e, t, n, r, "Literal `undefined` cannot be represented in JSON Schema")) return;
	} else if (typeof o == "bigint") {
		if (vc(e, t, n, r, "BigInt literals cannot be represented in JSON Schema")) return;
		a.push(Number(o));
	} else a.push(o);
	if (a.length !== 0) {
		if (a.length === 1) {
			let e = a[0];
			n.type = e === null ? "null" : typeof e, t.target === "draft-04" || t.target === "openapi-3.0" ? n.enum = [e] : n.const = e;
		} else a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), a.every((e) => typeof e == "boolean") && (n.type = "boolean"), a.every((e) => e === null) && (n.type = "null"), n.enum = a;
	}
}, $c = (e, t, n, r) => {
	vc(e, t, n, r, "Custom types cannot be represented in JSON Schema");
}, el = (e, t, n, r) => {
	vc(e, t, n, r, "Transforms cannot be represented in JSON Schema");
}, tl = (e, t, n, r) => {
	let i = n, a = e._zod.def, { minimum: o, maximum: s } = Uc(e);
	typeof o == "number" && (i.minItems = o), typeof s == "number" && (i.maxItems = s), i.type = "array", i.items = yc(a.element, t, {
		...r,
		path: [...r.path, "items"]
	});
};
function nl(e) {
	let t = e._zod.def;
	return t.type === "pipe" && t.in._zod.traits.has("$ZodTransform") ? nl(t.out) : t.type === "catch" ? nl(t.innerType) : e._zod.optin;
}
var rl = (e, t, n, r) => {
	let i = n, a = e._zod.def, o = a.shape;
	if (Object.getOwnPropertySymbols(o).length && vc(e, t, i, r, "Symbol keys cannot be represented in JSON Schema")) return;
	i.type = "object", i.properties = {};
	for (let e in o) zn(i.properties, e, yc(o[e], t, {
		...r,
		path: [
			...r.path,
			"properties",
			e
		]
	}));
	let s = [];
	for (let e of Object.keys(o)) {
		let n = a.shape[e];
		(t.io === "input" ? nl(n) === void 0 : n._zod.optout === void 0) && s.push(e);
	}
	s.length > 0 && (i.required = s), a.catchall?._zod.def.type === "never" ? i.additionalProperties = !1 : a.catchall ? a.catchall && (i.additionalProperties = yc(a.catchall, t, {
		...r,
		path: [...r.path, "additionalProperties"]
	})) : t.io === "output" && (i.additionalProperties = !1);
}, il = (e, t, n, r) => {
	let i = e._zod.def, a = i.inclusive === !1, o = i.options.map((e, n) => yc(e, t, {
		...r,
		path: [
			...r.path,
			a ? "oneOf" : "anyOf",
			n
		]
	}));
	a ? n.oneOf = o : n.anyOf = o;
}, al = (e, t, n, r) => {
	let i = e._zod.def, a = yc(i.left, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			0
		]
	}), o = yc(i.right, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			1
		]
	}), s = (e) => "allOf" in e && Object.keys(e).length === 1, c = [...s(a) ? a.allOf : [a], ...s(o) ? o.allOf : [o]];
	n.allOf = c, t.intersections.push(c);
}, ol = (e, t, n, r) => {
	let i = e._zod.def, a = yc(i.innerType, t, r), o = t.seen.get(e);
	t.target === "openapi-3.0" ? (o.ref = i.innerType, n.nullable = !0) : n.anyOf = [a, { type: "null" }];
}, sl = (e, t, n, r) => {
	let i = e._zod.def;
	yc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, cl = Symbol();
function ll(e, t, n, r, i) {
	let a = !1, o = JSON.stringify(e, (e, t) => typeof t == "bigint" ? (a = !0, null) : t);
	return a ? (vc(t, n, r, i, "BigInt defaults cannot be represented in JSON Schema"), cl) : JSON.parse(o);
}
var ul = (e, t, n, r) => {
	let i = e._zod.def;
	yc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o = ll(i.defaultValue, e, t, n, r);
	o !== cl && (n.default = o);
}, dl = (e, t, n, r) => {
	let i = e._zod.def;
	yc(i.innerType, t, r);
	let a = t.seen.get(e);
	if (a.ref = i.innerType, t.io !== "input") return;
	let o = ll(i.defaultValue, e, t, n, r);
	o !== cl && (n._prefault = o);
}, fl = (e, t, n, r) => {
	let i = e._zod.def;
	yc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o;
	try {
		o = i.catchValue(void 0);
	} catch {
		vc(e, t, n, r, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	n.default = o;
}, pl = (e, t, n, r) => {
	let i = e._zod.def, a = i.in._zod.traits.has("$ZodTransform"), o = t.io === "input" ? a ? i.out : i.in : i.out;
	yc(o, t, r);
	let s = t.seen.get(e);
	s.ref = o;
}, ml = (e, t, n, r) => {
	let i = e._zod.def;
	yc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, n.readOnly = !0;
}, hl = (e, t, n, r) => {
	let i = e._zod.def;
	yc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, gl = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _l(e, t, n) {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		get() {
			let e = n(this);
			return Object.defineProperty(this, t, {
				value: e,
				configurable: !0,
				writable: !0
			}), e;
		},
		set(e) {
			Object.defineProperty(this, t, {
				value: e,
				configurable: !0,
				writable: !0
			});
		}
	});
}
var vl = /*@__PURE__*/ M("ZodError", (e, t) => {
	$r.init(e, t), e.name = "ZodError";
	let n = Object.getPrototypeOf(e);
	gl.has(n) || (gl.add(n), _l(n, "format", (e) => (t) => ni(e, t)), _l(n, "flatten", (e) => (t) => ti(e, t)), _l(n, "addIssue", (e) => (t) => {
		e.issues.push(t), e.message = JSON.stringify(e.issues, Nn, 2);
	}), _l(n, "addIssues", (e) => (t) => {
		e.issues.push(...t), e.message = JSON.stringify(e.issues, Nn, 2);
	}), Object.defineProperty(n, "isEmpty", {
		configurable: !0,
		enumerable: !1,
		get() {
			return this.issues.length === 0;
		}
	}));
}, void 0, { Parent: Error }), yl = /* @__PURE__ */ ii(vl), bl = /* @__PURE__ */ ai(vl), xl = /* @__PURE__ */ oi(vl), B = /* @__PURE__ */ ci(vl), Sl = /* @__PURE__ */ mi(vl), Cl = /* @__PURE__ */ hi(vl), wl = /* @__PURE__ */ gi(vl), Tl = /* @__PURE__ */ _i(vl), El = /* @__PURE__ */ vi(vl), Dl = /* @__PURE__ */ yi(vl), Ol = /* @__PURE__ */ bi(vl), kl = /* @__PURE__ */ xi(vl);
//#endregion
//#region node_modules/zod/v4/classic/schemas.js
function Al() {
	Gr.localeError || Kr(cs());
}
function jl() {
	Gr.memoizer || Kr({ memoizer: as() });
}
var Ml = /*@__PURE__*/ M("ZodType", (e, t) => (Al(), I.init(e, t), e.def = t, e.type = t.type, e), {
	check(...e) {
		let t = this.def;
		return this.clone(Kn(t, { checks: [...t.checks ?? [], ...e.map((e) => typeof e == "function" ? { _zod: {
			check: e,
			def: { check: "custom" },
			onattach: []
		} } : e)] }), { parent: !0 });
	},
	with(...e) {
		return this.check(...e);
	},
	clone(e, t) {
		return nr(this, e, t);
	},
	brand() {
		return this;
	},
	register(e, t) {
		return e.add(this, t), this;
	},
	refine(e, t) {
		return this.check(Yu(e, t));
	},
	superRefine(e, t) {
		return this.check(Xu(e, t));
	},
	overwrite(e) {
		return this.check(/* @__PURE__ */ oc(e));
	},
	optional() {
		return ju(this);
	},
	exactOptional() {
		return Nu(this);
	},
	nullable() {
		return Fu(this);
	},
	nullish() {
		return ju(Fu(this));
	},
	nonoptional(e) {
		return Vu(this, e);
	},
	array() {
		return hu(this);
	},
	or(e) {
		return yu([this, e]);
	},
	and(e) {
		return Cu(this, e);
	},
	transform(e) {
		return Gu(this, ku(e));
	},
	default(e) {
		return Lu(this, e);
	},
	prefault(e) {
		return zu(this, e);
	},
	catch(e) {
		return Uu(this, e);
	},
	pipe(e) {
		return Gu(this, e);
	},
	readonly() {
		return qu(this);
	},
	describe(e) {
		let t = this.clone();
		return fs.add(t, { description: e }), t;
	},
	meta(...e) {
		if (e.length === 0) return fs.get(this);
		let t = this.clone();
		return fs.add(t, e[0]), t;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(e, ...t) {
		return t.length === 0 ? e(this) : e(this, ...t);
	},
	get "~standard"() {
		return kr(this, "~standard", {
			...ya(this),
			jsonSchema: {
				input: jc(this, "input"),
				output: jc(this, "output")
			}
		});
	},
	set "~standard"(e) {
		Or(this, "~standard", e);
	},
	parse: function e(t, n) {
		return yl(this, t, n, { callee: e });
	},
	parseAsync: async function e(t, n) {
		return await bl(this, t, n, { callee: e });
	},
	safeParse(e, t) {
		return xl(this, e, t);
	},
	async safeParseAsync(e, t) {
		return B(this, e, t);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(e) {
		Or(this, "spa", e);
	},
	validate(e, t) {
		return di(this, e, t);
	},
	validateAsync(e, t) {
		return pi(this, e, t);
	},
	encode: function e(t, n) {
		return Sl(this, t, n, { callee: e });
	},
	decode: function e(t, n) {
		return Cl(this, t, n, { callee: e });
	},
	encodeAsync: async function e(t, n) {
		return await wl(this, t, n, { callee: e });
	},
	decodeAsync: async function e(t, n) {
		return await Tl(this, t, n, { callee: e });
	},
	safeEncode(e, t) {
		return El(this, e, t);
	},
	safeDecode(e, t) {
		return Dl(this, e, t);
	},
	async safeEncodeAsync(e, t) {
		return Ol(this, e, t);
	},
	async safeDecodeAsync(e, t) {
		return kl(this, e, t);
	},
	toJSONSchema(e) {
		return Ac(this, {})(e);
	},
	get description() {
		return fs.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
}), Nl = /*@__PURE__*/ M("_ZodString", (e, t) => {
	ba.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => qc(e, t, n, r);
}, /*@__PURE__*/ Ar({
	format: (e) => Uc(e).format ?? null,
	minLength: (e) => Uc(e).minimum ?? null,
	maxLength: (e) => Uc(e).maximum ?? null
}, {
	regex(...e) {
		return this.check(/* @__PURE__ */ ec(...e));
	},
	includes(...e) {
		return this.check(/* @__PURE__ */ rc(...e));
	},
	startsWith(...e) {
		return this.check(/* @__PURE__ */ ic(...e));
	},
	endsWith(...e) {
		return this.check(/* @__PURE__ */ ac(...e));
	},
	min(...e) {
		return this.check(/* @__PURE__ */ Qs(...e));
	},
	max(...e) {
		return this.check(/* @__PURE__ */ Zs(...e));
	},
	length(...e) {
		return this.check(/* @__PURE__ */ $s(...e));
	},
	nonempty(...e) {
		return this.check(/* @__PURE__ */ Qs(1, ...e));
	},
	lowercase(e) {
		return this.check(/* @__PURE__ */ tc(e));
	},
	uppercase(e) {
		return this.check(/* @__PURE__ */ nc(e));
	},
	trim() {
		return this.check(/* @__PURE__ */ cc());
	},
	normalize(...e) {
		return this.check(/* @__PURE__ */ sc(...e));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ lc());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ uc());
	},
	slugify() {
		return this.check(/* @__PURE__ */ dc());
	}
})), Pl = /*@__PURE__*/ M("ZodString", (e, t) => {
	ba.init(e, t), Nl.init(e, t);
}, {
	email(e) {
		return this.check(/* @__PURE__ */ hs(Bl, e));
	},
	url(e) {
		return this.check(/* @__PURE__ */ xs(Wl, e));
	},
	jwt(e) {
		return this.check(/* @__PURE__ */ Is(au, e));
	},
	emoji(e) {
		return this.check(/* @__PURE__ */ Ss(Gl, e));
	},
	guid(e) {
		return this.check(/* @__PURE__ */ gs(Vl, e));
	},
	uuid(e) {
		return this.check(/* @__PURE__ */ _s(Hl, e));
	},
	uuidv4(e) {
		return this.check(/* @__PURE__ */ vs(Hl, e));
	},
	uuidv6(e) {
		return this.check(/* @__PURE__ */ ys(Hl, e));
	},
	uuidv7(e) {
		return this.check(/* @__PURE__ */ bs(Hl, e));
	},
	nanoid(e) {
		return this.check(/* @__PURE__ */ Cs(Kl, e));
	},
	cuid(e) {
		return this.check(/* @__PURE__ */ ws(ql, e));
	},
	cuid2(e) {
		return this.check(/* @__PURE__ */ Ts(Jl, e));
	},
	ulid(e) {
		return this.check(/* @__PURE__ */ Es(Yl, e));
	},
	base64(e) {
		return this.check(/* @__PURE__ */ Ns(nu, e));
	},
	base64url(e) {
		return this.check(/* @__PURE__ */ Ps(ru, e));
	},
	xid(e) {
		return this.check(/* @__PURE__ */ Ds(Xl, e));
	},
	ksuid(e) {
		return this.check(/* @__PURE__ */ Os(Zl, e));
	},
	ipv4(e) {
		return this.check(/* @__PURE__ */ ks(Ql, e));
	},
	ipv6(e) {
		return this.check(/* @__PURE__ */ As($l, e));
	},
	cidrv4(e) {
		return this.check(/* @__PURE__ */ js(eu, e));
	},
	cidrv6(e) {
		return this.check(/* @__PURE__ */ Ms(tu, e));
	},
	e164(e) {
		return this.check(/* @__PURE__ */ Fs(iu, e));
	},
	datetime(e) {
		return this.check(/* @__PURE__ */ Ls(Il, e));
	},
	date(e) {
		return this.check(/* @__PURE__ */ Rs(Ll, e));
	},
	time(e) {
		return this.check(/* @__PURE__ */ zs(Rl, e));
	},
	duration(e) {
		return this.check(/* @__PURE__ */ Bs(zl, e));
	}
});
function Fl(e) {
	return /* @__PURE__ */ ms(Pl, e);
}
var V = /*@__PURE__*/ M("ZodStringFormat", (e, t) => {
	L.init(e, t), Nl.init(e, t);
}), Il = /*@__PURE__*/ M("ZodISODateTime", (e, t) => {
	za.init(e, t), V.init(e, t);
}), Ll = /*@__PURE__*/ M("ZodISODate", (e, t) => {
	Ba.init(e, t), V.init(e, t);
}), Rl = /*@__PURE__*/ M("ZodISOTime", (e, t) => {
	Va.init(e, t), V.init(e, t);
}), zl = /*@__PURE__*/ M("ZodISODuration", (e, t) => {
	Ha.init(e, t), V.init(e, t);
}), Bl = /*@__PURE__*/ M("ZodEmail", (e, t) => {
	Ca.init(e, t), V.init(e, t);
}), Vl = /*@__PURE__*/ M("ZodGUID", (e, t) => {
	xa.init(e, t), V.init(e, t);
}), Hl = /*@__PURE__*/ M("ZodUUID", (e, t) => {
	Sa.init(e, t), V.init(e, t);
});
function Ul(e) {
	return /* @__PURE__ */ _s(Hl, e);
}
var Wl = /*@__PURE__*/ M("ZodURL", (e, t) => {
	ja.init(e, t), V.init(e, t);
}), Gl = /*@__PURE__*/ M("ZodEmoji", (e, t) => {
	Ma.init(e, t), V.init(e, t);
}), Kl = /*@__PURE__*/ M("ZodNanoID", (e, t) => {
	Na.init(e, t), V.init(e, t);
}), ql = /*@__PURE__*/ M("ZodCUID", (e, t) => {
	Pa.init(e, t), V.init(e, t);
}), Jl = /*@__PURE__*/ M("ZodCUID2", (e, t) => {
	Fa.init(e, t), V.init(e, t);
}), Yl = /*@__PURE__*/ M("ZodULID", (e, t) => {
	Ia.init(e, t), V.init(e, t);
}), Xl = /*@__PURE__*/ M("ZodXID", (e, t) => {
	La.init(e, t), V.init(e, t);
}), Zl = /*@__PURE__*/ M("ZodKSUID", (e, t) => {
	Ra.init(e, t), V.init(e, t);
}), Ql = /*@__PURE__*/ M("ZodIPv4", (e, t) => {
	Ua.init(e, t), V.init(e, t);
}), $l = /*@__PURE__*/ M("ZodIPv6", (e, t) => {
	Ka.init(e, t), V.init(e, t);
}), eu = /*@__PURE__*/ M("ZodCIDRv4", (e, t) => {
	qa.init(e, t), V.init(e, t);
}), tu = /*@__PURE__*/ M("ZodCIDRv6", (e, t) => {
	Ya.init(e, t), V.init(e, t);
}), nu = /*@__PURE__*/ M("ZodBase64", (e, t) => {
	Qa.init(e, t), V.init(e, t);
}), ru = /*@__PURE__*/ M("ZodBase64URL", (e, t) => {
	to.init(e, t), V.init(e, t);
}), iu = /*@__PURE__*/ M("ZodE164", (e, t) => {
	no.init(e, t), V.init(e, t);
}), au = /*@__PURE__*/ M("ZodJWT", (e, t) => {
	io.init(e, t), V.init(e, t);
}), ou = /*@__PURE__*/ M("ZodNumber", (e, t) => {
	ao.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => Jc(e, t, n, r), e.isFinite = !0;
}, /*@__PURE__*/ Ar({
	minValue: (e) => {
		let { minimum: t, exclusiveMinimum: n } = Uc(e);
		return Math.max(t ?? -Infinity, n ?? -Infinity);
	},
	maxValue: (e) => {
		let { maximum: t, exclusiveMaximum: n } = Uc(e);
		return Math.min(t ?? Infinity, n ?? Infinity);
	},
	isInt: (e) => {
		let { isInt: t, multipleOf: n } = Uc(e);
		return !!t || !!n?.some(Number.isSafeInteger);
	},
	format: (e) => Uc(e).format ?? null
}, {
	gt(e, t) {
		return this.check(/* @__PURE__ */ Js(e, t));
	},
	gte(e, t) {
		return this.check(/* @__PURE__ */ Ys(e, t));
	},
	min(e, t) {
		return this.check(/* @__PURE__ */ Ys(e, t));
	},
	lt(e, t) {
		return this.check(/* @__PURE__ */ Ks(e, t));
	},
	lte(e, t) {
		return this.check(/* @__PURE__ */ qs(e, t));
	},
	max(e, t) {
		return this.check(/* @__PURE__ */ qs(e, t));
	},
	int(e) {
		return this.check(su(e));
	},
	safe(e) {
		return this.check(su(e));
	},
	positive(e) {
		return this.check(/* @__PURE__ */ Js(0, e));
	},
	nonnegative(e) {
		return this.check(/* @__PURE__ */ Ys(0, e));
	},
	negative(e) {
		return this.check(/* @__PURE__ */ Ks(0, e));
	},
	nonpositive(e) {
		return this.check(/* @__PURE__ */ qs(0, e));
	},
	multipleOf(e, t) {
		return this.check(/* @__PURE__ */ Xs(e, t));
	},
	step(e, t) {
		return this.check(/* @__PURE__ */ Xs(e, t));
	},
	finite() {
		return this;
	}
}));
function H(e) {
	return /* @__PURE__ */ Vs(ou, e);
}
var U = /*@__PURE__*/ M("ZodNumberFormat", (e, t) => {
	oo.init(e, t), ou.init(e, t);
});
function su(e) {
	return /* @__PURE__ */ Hs(U, e);
}
var cu = /*@__PURE__*/ M("ZodBoolean", (e, t) => {
	so.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => Yc(e, t, n, r);
});
function lu(e) {
	return /* @__PURE__ */ Us(cu, e);
}
var uu = /*@__PURE__*/ M("ZodUnknown", (e, t) => {
	co.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (e, t, n) => void 0;
});
function du() {
	return /* @__PURE__ */ Ws(uu);
}
var fu = /*@__PURE__*/ M("ZodNever", (e, t) => {
	lo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => Xc(e, t, n, r);
});
function pu(e) {
	return /* @__PURE__ */ Gs(fu, e);
}
var mu = /*@__PURE__*/ M("ZodArray", (e, t) => {
	jl(), fo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => tl(e, t, n, r), e.element = t.element;
}, {
	min(e, t) {
		return this.check(/* @__PURE__ */ Qs(e, t));
	},
	nonempty(e) {
		return this.check(/* @__PURE__ */ Qs(1, e));
	},
	max(e, t) {
		return this.check(/* @__PURE__ */ Zs(e, t));
	},
	length(e, t) {
		return this.check(/* @__PURE__ */ $s(e, t));
	},
	unwrap() {
		return this.element;
	}
});
function hu(e, t) {
	return /* @__PURE__ */ fc(mu, e, t);
}
var gu = /*@__PURE__*/ M("ZodObject", (e, t) => {
	jl(), vo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => rl(e, t, n, r), Ir(e, "shape", (e) => e._zod.def.shape, !1);
}, {
	keyof() {
		return Tu(Object.keys(this._zod.def.shape));
	},
	catchall(e) {
		return this.clone(Kn(this._zod.def, { catchall: e }));
	},
	passthrough() {
		return this.clone(Kn(this._zod.def, { catchall: du() }));
	},
	loose() {
		return this.clone(Kn(this._zod.def, { catchall: du() }));
	},
	strict() {
		return this.clone(Kn(this._zod.def, { catchall: pu() }));
	},
	strip() {
		return this.clone(Kn(this._zod.def, { catchall: void 0 }));
	},
	extend(e) {
		return ur(this, e);
	},
	safeExtend(e) {
		return fr(this, e);
	},
	merge(e) {
		return pr(this, e);
	},
	pick(e) {
		return sr(this, e);
	},
	omit(e) {
		return lr(this, e);
	},
	partial(...e) {
		return mr(Au, this, e[0]);
	},
	exactPartial(...e) {
		return mr(Mu, this, e[0], "exactPartial");
	},
	required(...e) {
		return hr(Bu, this, e[0]);
	}
});
function _u(e, t) {
	return new gu({
		type: "object",
		shape: e ?? {},
		...A(t)
	});
}
var vu = /*@__PURE__*/ M("ZodUnion", (e, t) => {
	bo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => il(e, t, n, r), e.options = t.options;
});
function yu(e, t) {
	return new vu({
		type: "union",
		options: e,
		...A(t)
	});
}
var bu = /*@__PURE__*/ M("ZodDiscriminatedUnion", (e, t) => {
	vu.init(e, t), So.init(e, t);
});
function xu(e, t, n) {
	return new bu({
		type: "union",
		options: t,
		discriminator: e,
		...A(n)
	});
}
var Su = /*@__PURE__*/ M("ZodIntersection", (e, t) => {
	Co.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => al(e, t, n, r);
});
function Cu(e, t) {
	return new Su({
		type: "intersection",
		left: e,
		right: t
	});
}
var wu = /*@__PURE__*/ M("ZodEnum", (e, t) => {
	Eo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => Zc(e, t, n, r), e.enum = t.entries, e.options = [...e._zod.values];
	let n = new Set(Object.keys(t.entries));
	e.extract = (e, r) => {
		let i = {};
		for (let r of e) if (n.has(r)) i[r] = t.entries[r];
		else throw Error(`Key ${r} not found in enum`);
		return new wu({
			...t,
			checks: [],
			...A(r),
			entries: i
		});
	}, e.exclude = (e, r) => {
		let i = { ...t.entries };
		for (let t of e) if (n.has(t)) delete i[t];
		else throw Error(`Key ${t} not found in enum`);
		return new wu({
			...t,
			checks: [],
			...A(r),
			entries: i
		});
	};
});
function Tu(e, t) {
	return new wu({
		type: "enum",
		entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
		...A(t)
	});
}
var Eu = /*@__PURE__*/ M("ZodLiteral", (e, t) => {
	Do.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => Qc(e, t, n, r), e.values = new Set(t.values), Object.defineProperty(e, "value", { get() {
		if (t.values.length > 1) throw Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return t.values[0];
	} });
});
function Du(e, t) {
	return new Eu({
		type: "literal",
		values: Array.isArray(e) ? e : [e],
		...A(t)
	});
}
var Ou = /*@__PURE__*/ M("ZodTransform", (e, t) => {
	jl(), Oo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => el(e, t, n, r), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new Wr(e.constructor.name);
		n.addIssue = (r) => {
			if (typeof r == "string") n.issues.push(Er(r, n.value, t));
			else {
				let t = r;
				t.fatal && (t.continue = !1), t.code ??= "custom", "input" in t || (t.input = n.value), t.inst ??= e, n.issues.push(Er(t));
			}
		};
		let i = t.transform(n.value, n);
		return i instanceof Promise ? i.then((e) => (n.value = e, n)) : (n.value = i, n);
	};
});
function ku(e) {
	return new Ou({
		type: "transform",
		transform: e
	});
}
var Au = /*@__PURE__*/ M("ZodOptional", (e, t) => {
	Ao.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => hl(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function ju(e) {
	return new Au({
		type: "optional",
		innerType: e
	});
}
var Mu = /*@__PURE__*/ M("ZodExactOptional", (e, t) => {
	jo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => hl(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Nu(e) {
	return new Mu({
		type: "optional",
		innerType: e
	});
}
var Pu = /*@__PURE__*/ M("ZodNullable", (e, t) => {
	Mo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => ol(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Fu(e) {
	return new Pu({
		type: "nullable",
		innerType: e
	});
}
var Iu = /*@__PURE__*/ M("ZodDefault", (e, t) => {
	No.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => ul(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeDefault = e.unwrap;
});
function Lu(e, t) {
	return new Iu({
		type: "default",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : $n(t);
		}
	});
}
var Ru = /*@__PURE__*/ M("ZodPrefault", (e, t) => {
	Fo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => dl(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function zu(e, t) {
	return new Ru({
		type: "prefault",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : $n(t);
		}
	});
}
var Bu = /*@__PURE__*/ M("ZodNonOptional", (e, t) => {
	Io.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => sl(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Vu(e, t) {
	return new Bu({
		type: "nonoptional",
		innerType: e,
		...A(t)
	});
}
var Hu = /*@__PURE__*/ M("ZodCatch", (e, t) => {
	zo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => fl(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeCatch = e.unwrap;
});
function Uu(e, t) {
	return new Hu({
		type: "catch",
		innerType: e,
		catchValue: typeof t == "function" ? t : Rr(t)
	});
}
var Wu = /*@__PURE__*/ M("ZodPipe", (e, t) => {
	Bo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => pl(e, t, n, r), e.in = t.in, e.out = t.out;
});
function Gu(e, t) {
	return new Wu({
		type: "pipe",
		in: e,
		out: t
	});
}
var Ku = /*@__PURE__*/ M("ZodReadonly", (e, t) => {
	Ho.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => ml(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function qu(e) {
	return new Ku({
		type: "readonly",
		innerType: e
	});
}
var Ju = /*@__PURE__*/ M("ZodCustom", (e, t) => {
	Wo.init(e, t), Ml.init(e, t), e._zod.processJSONSchema = (t, n, r) => $c(e, t, n, r);
});
function Yu(e, t = {}) {
	return /* @__PURE__ */ pc(Ju, e, t);
}
function Xu(e, t) {
	return /* @__PURE__ */ mc(e, t);
}
//#endregion
//#region packages/domain/notification-preferences.ts
var Zu = g(), Qu = [
	"orderEmail",
	"promotionsEmail",
	"orderSms"
], $u = _u({
	orderEmail: lu(),
	promotionsEmail: lu(),
	orderSms: lu()
}).strict(), ed = Fl().trim().max(20).transform((e) => e.replace(/\s/g, "").replace(/^0/, "+84")).refine((e) => e === "" || /^\+84[35789][0-9]{8}$/.test(e), "Số điện thoại Việt Nam chưa hợp lệ."), td = _u({
	requested: lu(),
	generation: H().int().nonnegative(),
	confirmedGeneration: H().int().nonnegative().nullable()
}).strict(), W = _u({
	schemaVersion: Du(1),
	version: H().int().nonnegative(),
	email: Fl().max(254),
	phone: ed,
	topics: _u({
		orderEmail: td,
		promotionsEmail: td,
		orderSms: td
	}).strict(),
	updatedAt: H().int().nonnegative()
}).strict();
function G(e) {
	return e === "orderSms" ? "sms" : "email";
}
function K(e) {
	return e.requested ? e.confirmedGeneration === e.generation ? "active" : "pending" : "off";
}
function q(e) {
	return {
		schemaVersion: 1,
		version: 0,
		email: e,
		phone: "",
		topics: {
			orderEmail: {
				requested: !1,
				generation: 0,
				confirmedGeneration: null
			},
			promotionsEmail: {
				requested: !1,
				generation: 0,
				confirmedGeneration: null
			},
			orderSms: {
				requested: !1,
				generation: 0,
				confirmedGeneration: null
			}
		},
		updatedAt: 0
	};
}
function J(e, t, n, r, i) {
	if (r.orderSms && !n) throw Error("PHONE_REQUIRED");
	let a = structuredClone(e), o = e.email !== t || e.phone !== n;
	a.email = t, a.phone = n;
	for (let i of Qu) {
		let s = e.topics[i], c = G(i) === "email" ? e.email !== t : e.phone !== n;
		(s.requested !== r[i] || c) && (o = !0, a.topics[i] = {
			requested: r[i],
			generation: s.generation + 1,
			confirmedGeneration: null
		});
	}
	return o && (a.version++, a.updatedAt = i), a;
}
var nd = xu("action", [
	_u({ action: Du("read") }).strict(),
	_u({
		action: Du("save"),
		operationId: Ul(),
		expectedVersion: H().int().nonnegative(),
		selected: $u,
		phone: ed,
		source: Tu(["checkout", "profile"])
	}).strict(),
	_u({
		action: Du("resend"),
		operationId: Ul(),
		expectedVersion: H().int().nonnegative(),
		channel: Tu(["email", "sms"])
	}).strict(),
	_u({
		action: Du("confirm"),
		token: Fl().regex(/^[a-f0-9]{64}$/)
	}).strict(),
	_u({
		action: Du("unsubscribe"),
		token: Fl().regex(/^[a-f0-9]{64}$/)
	}).strict()
]);
//#endregion
//#region docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-R2/fixture-service.ts
function rd(e = "") {
	let t = new URLSearchParams(e), n = t.get("mode") || "ok", r = {
		email: t.get("availability") === "ready",
		sms: !1
	}, i = {
		"owner-A": {
			uid: "owner-A",
			email: "owner-a@example.invalid",
			displayName: "Khách minh họa A"
		},
		"owner-B": {
			uid: "owner-B",
			email: "owner-b@example.invalid",
			displayName: "Khách minh họa B"
		}
	}, a = "owner-A", o = { currentUser: i[a] }, s = Object.freeze({ fixture: !0 }), c = /* @__PURE__ */ new Map();
	for (let e of Object.keys(i)) {
		let n = q(i[e].email), r = t.get(e === "owner-A" ? "state" : "stateB") || "off";
		if (r === "pending" || r === "active") for (let e of ["orderEmail", "promotionsEmail"]) n.topics[e] = {
			requested: !0,
			generation: 1,
			confirmedGeneration: r === "active" ? 1 : null
		};
		r === "partial" && (n.topics.orderEmail = {
			requested: !0,
			generation: 1,
			confirmedGeneration: 1
		}), c.set(e, n);
	}
	let l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Set(), d = [], f = [], p = /* @__PURE__ */ new Set(), m = 0, h = () => {
		m++, p.forEach((e) => e());
	}, g = (e) => ({
		...structuredClone(c.get(e)),
		availability: { ...r }
	}), _ = (e) => {
		throw Object.assign(/* @__PURE__ */ Error("SYNTHETIC_FIXTURE_RESPONSE"), e ? { code: `functions/${e}` } : {});
	};
	function v(e, t) {
		return new Promise((n) => {
			f.push({
				owner: e,
				complete: () => n(structuredClone(t))
			}), h();
		});
	}
	async function y(e, r) {
		e !== "notificationPreferences" && _("permission-denied");
		let o = nd.parse(r), s = a;
		if (d.push({
			action: o.action,
			owner: s,
			operationId: "operationId" in o ? o.operationId : "none"
		}), d.length > 80 && d.shift(), h(), o.action === "read") return n === "loading" ? v(s, g(s)) : (n === "loadfail" && !u.has(`${s}:read`) && (u.add(`${s}:read`), _()), g(s));
		if (o.action === "confirm" || o.action === "unsubscribe") {
			n === "tokenfail" && _("failed-precondition");
			let e = c.get(s), r = t.get("linkTopic") === "orderEmail" ? "orderEmail" : "promotionsEmail";
			return o.action === "confirm" ? e.topics[r].confirmedGeneration = e.topics[r].generation : e.topics[r] = {
				requested: !1,
				generation: e.topics[r].generation + 1,
				confirmedGeneration: null
			}, { status: o.action === "confirm" ? "confirmed" : "unsubscribed" };
		}
		let f = `${s}:${o.operationId}`, p = JSON.stringify(o), m = l.get(f);
		if (m) return m.identity !== p && _("already-exists"), structuredClone(m.result);
		n === "conflict" && _("aborted"), n === "unauthorized" && _("permission-denied"), n === "quota" && _("resource-exhausted");
		let y = c.get(s);
		o.expectedVersion !== y.version && _("aborted"), o.action === "save" && c.set(s, J(y, i[s].email, o.phone, o.selected, Date.now()));
		let b = g(s);
		return l.set(f, {
			identity: p,
			result: structuredClone(b)
		}), n === "savepending" && o.action === "save" ? v(s, b) : (n === "uncertain" && !u.has(`${s}:mutation`) && (u.add(`${s}:mutation`), _()), b);
	}
	return {
		auth: o,
		db: s,
		callService: y,
		subscribe: (e) => (p.add(e), () => {
			p.delete(e);
		}),
		snapshot: () => m,
		user: () => i[a],
		owner: () => a,
		setOwner: (e) => {
			a = e, o.currentUser = i[e], h();
		},
		calls: () => d.map((e) => ({ ...e })),
		pendingCount: () => f.length,
		pendingOwner: () => f[0]?.owner ?? "none",
		resolvePending: () => {
			f.shift()?.complete(), h();
		},
		profile: (e) => ({
			displayName: e === "owner-B" ? i["owner-B"].displayName : i["owner-A"].displayName,
			businessName: "",
			marketingConsent: !1,
			version: 1
		})
	};
}
var id = rd(typeof location > "u" ? "" : location.search), ad = id.auth, od = id.db, Y = id.callService, sd = W.extend({ availability: _u({
	email: lu(),
	sms: lu()
}).strict() });
function cd(e) {
	return $u.parse(Object.fromEntries(Object.entries(e.topics).map(([e, t]) => [e, t.requested])));
}
//#endregion
//#region src/features/notifications/use-notification-preferences.ts
var ld = {
	orderEmail: !1,
	promotionsEmail: !1,
	orderSms: !1
};
function ud(e, t) {
	let n = e?.uid ?? "", r = (0, _.useRef)(n);
	r.current = n;
	let i = (0, _.useRef)(0), a = (0, _.useRef)(!1), o = (0, _.useRef)(null), [s, c] = (0, _.useState)({
		owner: n,
		view: null,
		selected: ld,
		phone: "",
		error: "",
		busy: !1,
		message: "",
		uncertain: !1
	}), l = s.owner === n ? s : {
		owner: n,
		view: null,
		selected: ld,
		phone: "",
		error: "",
		busy: !1,
		message: "",
		uncertain: !1
	}, u = (0, _.useCallback)(async () => {
		if (!n || a.current || o.current) return;
		let e = ++i.current;
		c((e) => ({
			...e,
			owner: n,
			view: null,
			error: "",
			busy: !0
		}));
		try {
			let t = sd.parse(await Y("notificationPreferences", { action: "read" }));
			e === i.current && r.current === n && c({
				owner: n,
				view: t,
				selected: cd(t),
				phone: t.phone,
				error: "",
				busy: !1,
				message: "",
				uncertain: !1
			});
		} catch {
			e === i.current && r.current === n && c((e) => ({
				...e,
				owner: n,
				busy: !1,
				error: "Chưa tải được tùy chọn thông báo. Thử tải lại."
			}));
		}
	}, [n]);
	(0, _.useEffect)(() => (a.current = !1, o.current = null, c({
		owner: n,
		view: null,
		selected: ld,
		phone: "",
		error: "",
		busy: !1,
		message: "",
		uncertain: !1
	}), u(), () => {
		i.current++;
	}), [n, u]);
	let d = !!l.view && (l.phone !== l.view.phone || Object.keys(ld).some((e) => l.selected[e] !== l.view.topics[e].requested));
	async function f(e) {
		if (!n || ad?.currentUser?.uid !== n || !l.view || a.current) return;
		let s = i.current;
		if (!o.current) {
			if (!e && !d) return;
			let n = ed.safeParse(l.phone);
			if (!e && (!n.success || l.selected.orderSms && !n.data)) {
				c((e) => ({
					...e,
					error: "Nhập số di động của bạn để nhận SMS."
				}));
				return;
			}
			o.current = nd.parse(e ? {
				action: "resend",
				channel: e,
				operationId: crypto.randomUUID(),
				expectedVersion: l.view.version
			} : {
				action: "save",
				operationId: crypto.randomUUID(),
				expectedVersion: l.view.version,
				selected: l.selected,
				phone: n.success ? n.data : "",
				source: t
			});
		}
		let u = o.current;
		a.current = !0, c((e) => ({
			...e,
			busy: !0,
			error: "",
			message: "",
			uncertain: !0
		}));
		let f = () => r.current === n && i.current === s && ad?.currentUser?.uid === n;
		try {
			let e = sd.parse(await Y("notificationPreferences", u));
			if (!f()) return;
			o.current = null, c({
				owner: n,
				view: e,
				selected: cd(e),
				phone: e.phone,
				error: "",
				busy: !1,
				uncertain: !1,
				message: u.action === "resend" ? "Đã lưu yêu cầu gửi lại xác nhận." : "Đã lưu tùy chọn thông báo."
			});
		} catch (e) {
			if (!f()) return;
			let t = String(e.code ?? "").replace(/^functions\//, ""), n = [
				"invalid-argument",
				"permission-denied",
				"unauthenticated",
				"aborted",
				"already-exists",
				"failed-precondition",
				"resource-exhausted"
			].includes(t);
			n && (o.current = null), c((e) => ({
				...e,
				busy: !1,
				uncertain: !n,
				error: t === "aborted" ? "Tùy chọn đã thay đổi. Tải lại trước khi lưu." : t === "resource-exhausted" ? "Chờ một lúc rồi yêu cầu xác nhận lại." : n ? "Chưa lưu được tùy chọn thông báo. Tải lại rồi thử lại." : "Chưa rõ kết quả lưu. Kiểm tra lại lần gửi này."
			}));
		} finally {
			f() && (a.current = !1);
		}
	}
	return {
		...l,
		dirty: d,
		load: u,
		save: () => f(),
		resend: (e) => f(e),
		setSelected: (e) => {
			!l.busy && !l.uncertain && c((t) => ({
				...t,
				selected: e,
				error: "",
				message: ""
			}));
		},
		setPhone: (e) => {
			!l.busy && !l.uncertain && c((t) => ({
				...t,
				phone: e,
				error: "",
				message: ""
			}));
		}
	};
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
var dd = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), X = (/* @__PURE__ */ o(((e, t) => {
	t.exports = dd();
})))(), fd = {
	orderEmail: "Cập nhật đơn hàng qua email",
	promotionsEmail: "Ưu đãi qua email",
	orderSms: "Cập nhật đơn hàng qua SMS"
};
function pd({ controller: e }) {
	return /* @__PURE__ */ (0, X.jsxs)("div", {
		className: "subscriptionStatus",
		"aria-live": "polite",
		children: [
			e.error && /* @__PURE__ */ (0, X.jsx)("p", {
				role: "alert",
				children: e.error
			}),
			e.message && /* @__PURE__ */ (0, X.jsx)("p", {
				role: "status",
				children: e.message
			}),
			e.error && !e.busy && /* @__PURE__ */ (0, X.jsx)("button", {
				type: "button",
				onClick: () => void (e.uncertain ? e.save() : e.load()),
				children: e.uncertain ? "Kiểm tra lần gửi" : "Thử tải lại"
			})
		]
	});
}
function md({ controller: e }) {
	let t = (0, _.useId)(), n = (0, _.useRef)(null);
	return (0, _.useEffect)(() => {
		n.current && (n.current.indeterminate = e.selected.orderEmail !== e.selected.promotionsEmail);
	}, [
		e.selected.orderEmail,
		e.selected.promotionsEmail,
		e.view
	]), /* @__PURE__ */ (0, X.jsx)("div", {
		className: "subscriptionChoices purchaseWide",
		children: e.view ? /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [
			/* @__PURE__ */ (0, X.jsxs)("label", { children: [/* @__PURE__ */ (0, X.jsx)("input", {
				ref: n,
				type: "checkbox",
				checked: e.selected.orderEmail && e.selected.promotionsEmail,
				disabled: e.busy || e.uncertain,
				onChange: (t) => e.setSelected({
					...e.selected,
					orderEmail: t.target.checked,
					promotionsEmail: t.target.checked
				})
			}), /* @__PURE__ */ (0, X.jsx)("span", { children: "Nhận cập nhật đơn hàng và ưu đãi qua email" })] }),
			/* @__PURE__ */ (0, X.jsxs)("label", { children: [/* @__PURE__ */ (0, X.jsx)("input", {
				type: "checkbox",
				checked: e.selected.orderSms,
				disabled: e.busy || e.uncertain,
				onChange: (t) => e.setSelected({
					...e.selected,
					orderSms: t.target.checked
				})
			}), /* @__PURE__ */ (0, X.jsx)("span", { children: "Nhận cập nhật đơn hàng qua SMS" })] }),
			e.selected.orderSms && /* @__PURE__ */ (0, X.jsxs)("label", {
				className: "subscriptionPhone",
				htmlFor: t,
				children: [
					/* @__PURE__ */ (0, X.jsx)("span", { children: "Số di động nhận thông báo" }),
					/* @__PURE__ */ (0, X.jsx)("input", {
						id: t,
						type: "tel",
						autoComplete: "tel",
						value: e.phone,
						maxLength: 20,
						disabled: e.busy || e.uncertain,
						onChange: (t) => e.setPhone(t.target.value),
						placeholder: "Số di động của bạn"
					}),
					!e.view.availability.sms && /* @__PURE__ */ (0, X.jsx)("small", { children: "SMS chưa sẵn sàng. Bạn vẫn có thể lưu lựa chọn." })
				]
			})
		] }) : /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [/* @__PURE__ */ (0, X.jsx)("span", {
			className: "subscriptionMuted",
			children: e.busy ? "Đang tải tùy chọn nhận tin…" : "Tùy chọn nhận tin chưa tải được."
		}), /* @__PURE__ */ (0, X.jsx)(pd, { controller: e })] })
	});
}
function hd({ user: e, blocked: t = !1, onPendingChange: n }) {
	let r = ud(e, "profile"), i = (0, _.useId)();
	return (0, _.useEffect)(() => (n?.(r.busy || r.uncertain), () => n?.(!1)), [
		r.busy,
		r.uncertain,
		n
	]), /* @__PURE__ */ (0, X.jsxs)("section", {
		className: "profileCard subscriptionPanel",
		"aria-labelledby": i,
		children: [
			/* @__PURE__ */ (0, X.jsx)("header", {
				className: "profileCardHeading",
				children: /* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("h2", {
					id: i,
					children: "Thông báo"
				}), /* @__PURE__ */ (0, X.jsx)("p", { children: "Chọn cách nhận tin từ SatsunicGo." })] })
			}),
			r.view ? /* @__PURE__ */ (0, X.jsx)("form", {
				onSubmit: (e) => {
					e.preventDefault(), r.save();
				},
				children: /* @__PURE__ */ (0, X.jsxs)("fieldset", {
					disabled: t || r.busy || r.uncertain,
					children: [
						[
							"orderEmail",
							"promotionsEmail",
							"orderSms"
						].map((e) => {
							let t = e === "orderSms" ? "sms" : "email", n = r.view.availability[t], a = K(r.view.topics[e]);
							return /* @__PURE__ */ (0, X.jsxs)("div", {
								className: "subscriptionRow",
								children: [/* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("label", {
									htmlFor: `${i}-${e}`,
									children: fd[e]
								}), /* @__PURE__ */ (0, X.jsx)("small", { children: n ? a === "active" ? "Đang nhận" : a === "pending" ? "Chờ xác nhận" : "Đã tắt" : "Chưa sẵn sàng" })] }), /* @__PURE__ */ (0, X.jsx)("input", {
									id: `${i}-${e}`,
									type: "checkbox",
									role: "switch",
									checked: r.selected[e],
									onChange: (t) => r.setSelected({
										...r.selected,
										[e]: t.target.checked
									})
								})]
							}, e);
						}),
						/* @__PURE__ */ (0, X.jsxs)("label", {
							className: "subscriptionPhone",
							children: [/* @__PURE__ */ (0, X.jsx)("span", { children: "Số di động nhận SMS" }), /* @__PURE__ */ (0, X.jsx)("input", {
								type: "tel",
								autoComplete: "tel",
								value: r.phone,
								maxLength: 20,
								onChange: (e) => r.setPhone(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, X.jsx)("div", {
							className: "profileFormFooter",
							children: /* @__PURE__ */ (0, X.jsx)("button", {
								className: "primary",
								disabled: !r.dirty,
								children: "Lưu tùy chọn"
							})
						}),
						["email", "sms"].map((e) => r.view.availability[e] && Object.entries(r.view.topics).some(([t, n]) => (t === "orderSms" ? "sms" : "email") === e && K(n) === "pending") && /* @__PURE__ */ (0, X.jsxs)("button", {
							type: "button",
							disabled: r.dirty,
							onClick: () => void r.resend(e),
							children: ["Gửi lại xác nhận ", e === "sms" ? "SMS" : "email"]
						}, e))
					]
				})
			}) : /* @__PURE__ */ (0, X.jsx)("p", {
				className: "subscriptionMuted",
				children: r.busy ? "Đang tải tùy chọn…" : "Chưa tải được tùy chọn."
			}),
			/* @__PURE__ */ (0, X.jsx)(pd, { controller: r })
		]
	});
}
function gd() {
	let [e] = (0, _.useState)(() => {
		if (typeof window > "u") return null;
		let e = /^#notification-(confirm|unsubscribe)=([a-f0-9]{64})$/.exec(window.location.hash);
		return e ? {
			action: e[1],
			token: e[2]
		} : null;
	}), [t, n] = (0, _.useState)(!1), [r, i] = (0, _.useState)("");
	if ((0, _.useEffect)(() => {
		e && window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
	}, [e]), !e) return null;
	async function a() {
		if (!t && e) {
			n(!0);
			try {
				await Y("notificationPreferences", e), i(e.action === "confirm" ? "Đã xác nhận đăng ký nhận tin." : "Đã tắt loại tin trong liên kết này.");
			} catch {
				i("Liên kết chưa xử lý được hoặc đã hết hạn. Thử lại hoặc quản lý trong Thông báo.");
			} finally {
				n(!1);
			}
		}
	}
	return /* @__PURE__ */ (0, X.jsxs)("section", {
		className: "profileCard subscriptionPanel",
		children: [
			/* @__PURE__ */ (0, X.jsx)("h2", { children: e.action === "confirm" ? "Xác nhận đăng ký nhận tin" : "Tắt nhận tin" }),
			/* @__PURE__ */ (0, X.jsx)("button", {
				type: "button",
				disabled: t,
				onClick: () => void a(),
				children: t ? "Đang xử lý…" : e.action === "confirm" ? "Xác nhận đăng ký" : "Tắt nhận tin"
			}),
			/* @__PURE__ */ (0, X.jsx)("p", {
				role: "status",
				children: r
			})
		]
	});
}
//#endregion
//#region src/shared/feedback.ts
var _d = /* @__PURE__ */ new Set(), vd = 0, yd = 0;
function bd({ overlay: e = !0 } = {}) {
	vd++, e && yd++, _d.forEach((e) => e());
	let t = !1;
	return () => {
		t || (t = !0, vd--, e && yd--, _d.forEach((e) => e()));
	};
}
var xd = 0, Sd = /* @__PURE__ */ new Set();
function Cd(e, t = "info") {
	++xd, Sd.forEach((e) => e());
}
//#endregion
//#region src/shared/Loading.tsx
function wd() {
	return /* @__PURE__ */ (0, X.jsx)("span", {
		className: "loadingBar",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, X.jsx)("span", {})
	});
}
function Td({ children: e, className: t = "", overlay: n = !1, variant: r = "inline" }) {
	return (0, _.useEffect)(() => n ? bd() : void 0, [n]), r === "overlay" ? /* @__PURE__ */ (0, X.jsx)("div", {
		className: `loadingOverlay ${t}`,
		children: /* @__PURE__ */ (0, X.jsxs)("div", {
			className: "loadingOverlayCard",
			role: "status",
			"aria-live": "polite",
			"aria-atomic": "true",
			"aria-busy": "true",
			children: [/* @__PURE__ */ (0, X.jsx)(wd, {}), /* @__PURE__ */ (0, X.jsx)("div", { children: e })]
		})
	}) : /* @__PURE__ */ (0, X.jsxs)("div", {
		className: `loadingState loadingState--${r} ${t}`,
		role: "status",
		"aria-busy": "true",
		children: [/* @__PURE__ */ (0, X.jsx)(wd, {}), /* @__PURE__ */ (0, X.jsx)("div", { children: e })]
	});
}
//#endregion
//#region \0emailR2Firestore
var Ed = (e, ...t) => ({ path: t.join("/") }), Dd = (e, t) => ({ path: t }), Od = (e, t, n) => ({
	field: e,
	operation: t,
	value: n
}), kd = (e) => ({ count: e }), Ad = (e, ...t) => ({
	...e,
	filters: t
});
function jd(e, t) {
	let n = !0;
	return queueMicrotask(() => {
		n && t(e.path.startsWith("users/") ? { data: () => id.profile(e.path.split("/")[1]) } : { docs: [] });
	}), () => {
		n = !1;
	};
}
//#endregion
//#region src/features/profile/profile-state.ts
var Md = {
	displayName: "",
	businessName: "",
	marketingConsent: !1
};
function Nd(e = "") {
	return {
		uid: e,
		locked: !1,
		profile: { ...Md },
		addresses: [],
		profileReady: !1,
		addressesReady: !1,
		profileError: "",
		addressesError: ""
	};
}
function Pd(e, t) {
	if (t.type === "reset") return Nd(t.uid);
	if (t.uid !== e.uid) return e;
	if (t.type === "locked") return {
		...Nd(e.uid),
		locked: !0,
		profileError: "Tài khoản đang bị khóa. Bạn chưa thể xem hoặc cập nhật hồ sơ và địa chỉ."
	};
	if (e.locked) return e;
	switch (t.type) {
		case "profile": return {
			...e,
			profile: t.profile,
			version: t.version,
			profileReady: !0,
			profileError: ""
		};
		case "addresses": return {
			...e,
			addresses: t.addresses,
			addressesReady: !0,
			addressesError: ""
		};
		case "profile-error": return {
			...e,
			profile: { ...Md },
			version: void 0,
			profileReady: !1,
			profileError: "Chưa tải được hồ sơ. Kiểm tra kết nối và thử lại."
		};
		case "addresses-error": return {
			...e,
			addresses: [],
			addressesReady: !1,
			addressesError: "Chưa tải được địa chỉ. Kiểm tra kết nối và thử lại."
		};
		case "edit": return e.profileReady ? {
			...e,
			profile: t.profile
		} : e;
	}
}
_u({
	schemaVersion: Du(1),
	action: Tu(["saveProfile", "saveAddress"]),
	operationId: Fl().uuid(),
	commandHash: Fl().regex(/^[a-f0-9]{64}$/),
	expectedVersion: H().int().nonnegative().safe()
}).strict();
var Fd = _u({
	id: Fl().min(1).max(128),
	version: H().int().positive().safe()
}).strict(), Id = xu("status", [_u({
	status: Du("saved"),
	result: Fd
}).strict(), _u({ status: Du("not-saved") }).strict()]), Ld = async () => null, Rd = async () => {
	throw Object.assign(Error("FIXTURE_PROFILE_WRITES_DISABLED"), { code: "functions/permission-denied" });
}, zd = async () => {};
//#endregion
//#region src/features/profile/Profile.tsx
function Bd({ user: e, blocked: t = !1, onPendingChange: n }) {
	let r = (0, _.useId)(), [i, a] = (0, _.useReducer)(Pd, void 0, () => Nd(e?.uid)), o = i.uid === (e?.uid ?? "") ? i : Nd(e?.uid), { profile: s, version: c, addresses: l } = o, u = (0, _.useRef)(e?.uid);
	u.current = e?.uid;
	let d = (t) => a({
		type: "edit",
		uid: e?.uid ?? "",
		profile: t
	}), [f, p] = (0, _.useState)(""), [m, h] = (0, _.useState)(!1), [g, v] = (0, _.useState)(0), [y, b] = (0, _.useState)(1), [ee, te] = (0, _.useState)(""), [x, S] = (0, _.useState)(!1), C = (0, _.useRef)(null), ne = (0, _.useRef)(null), [w, re] = (0, _.useState)(!1), [ie, ae] = (0, _.useState)(0);
	(0, _.useEffect)(() => {
		C.current = null, ne.current = null, se.current = !1, S(!1), re(!1);
		let t = !0;
		return e ? Ld(e.uid).then((n) => {
			t && u.current === e.uid && (ne.current = n, S(!!n), re(!0), n && p("Có lần lưu đang chờ kết quả. Kiểm tra lần lưu trước khi tiếp tục."));
		}).catch(() => {
			t && p("Chưa kiểm tra được lần lưu trước. Anh/chị thử kiểm tra lại nhé.");
		}) : re(!0), () => {
			t = !1, C.current = null, ne.current = null;
		};
	}, [e?.uid, ie]), (0, _.useEffect)(() => {
		n?.(m || x);
	}, [
		m,
		x,
		n
	]);
	let oe = (0, _.useRef)(0), se = (0, _.useRef)(!1);
	(0, _.useEffect)(() => {
		if (oe.current++, a({
			type: "reset",
			uid: e?.uid ?? ""
		}), te(""), p(""), h(!1), !e) return;
		if (!od) {
			a({
				type: "profile-error",
				uid: e.uid
			}), a({
				type: "addresses-error",
				uid: e.uid
			});
			return;
		}
		let t = !0, n = !1, r = e.uid, i = jd(Ed(od, "users", r), (i) => {
			if (!t || n) return;
			let o = i.data();
			if (o?.locked === !0) {
				n = !0, oe.current++, C.current = null, se.current = !1, S(!1), a({
					type: "locked",
					uid: r
				}), p(""), h(!1);
				return;
			}
			a({
				type: "profile",
				uid: r,
				version: o?.version,
				profile: {
					displayName: o?.displayName ?? e.displayName ?? "",
					businessName: o?.businessName ?? "",
					marketingConsent: o?.marketingConsent === !0
				}
			});
		}, () => {
			t && !n && a({
				type: "profile-error",
				uid: r
			});
		}), o = jd(Ad(Dd(od, "addresses"), Od("ownerId", "==", r), kd(20)), (e) => {
			t && !n && a({
				type: "addresses",
				uid: r,
				addresses: e.docs.map((e) => ({
					id: e.id,
					recipient: String(e.data().recipient ?? ""),
					address: String(e.data().address ?? "")
				}))
			});
		}, () => {
			t && !n && a({
				type: "addresses-error",
				uid: r
			});
		});
		return () => {
			t = !1, oe.current++, i(), o();
		};
	}, [e?.uid, g]);
	async function ce(n, r) {
		if (n?.preventDefault(), !e || ad?.currentUser?.uid !== e.uid || i.locked || se.current || t || i.uid !== e.uid || !i.profileReady || !w || (C.current?.command.action ?? r) === "saveAddress" && !i.addressesReady || ne.current && n || C.current && (n || C.current.owner !== e.uid)) return;
		if (!C.current) {
			if (!n || !r) return;
			let t = new FormData(n.currentTarget);
			C.current = {
				owner: e.uid,
				command: {
					action: r,
					operationId: crypto.randomUUID(),
					...r === "saveProfile" && c !== void 0 ? { expectedVersion: c } : {},
					payload: r === "saveProfile" ? {
						displayName: String(t.get("displayName") ?? ""),
						businessName: String(t.get("businessName") ?? ""),
						marketingConsent: i.profile.marketingConsent
					} : {
						recipient: String(t.get("recipient") ?? ""),
						phone: String(t.get("phone") ?? ""),
						address: String(t.get("address") ?? "")
					}
				}
			};
		}
		let a = C.current.command;
		se.current = !0;
		let o = oe.current, s = e.uid, l = () => o === oe.current && u.current === s && ad?.currentUser?.uid === s;
		p(""), te(""), h(!0), S(!0);
		try {
			if (!ne.current) {
				let e = await Rd(s, a);
				if (!l()) return;
				if (ne.current = e.pointer, !e.reserved) {
					C.current = null, p("Có lần lưu đang chờ kết quả. Kiểm tra lần lưu trước khi tiếp tục.");
					return;
				}
			}
			let e = Fd.parse(await Y("workspaceCommand", a));
			if (a.action === "saveProfile" && e.id !== s || e.version !== (a.expectedVersion ?? 0) + 1) throw Error("INVALID_SAVE_RESULT");
			if (l()) {
				if (await /* @__PURE__ */ zd(s, ne.current), !l()) return;
				ne.current = null, C.current = null, S(!1), Cd(a.action === "saveProfile" ? "Đã lưu hồ sơ." : "Đã lưu địa chỉ.", "success");
			}
		} catch (e) {
			if (l()) {
				let t = String(e?.code ?? "").replace(/^functions\//, "");
				[
					"invalid-argument",
					"permission-denied",
					"unauthenticated",
					"aborted",
					"already-exists",
					"failed-precondition"
				].includes(t) ? (C.current = null, p("Chưa lưu được thông tin. Kiểm tra lần lưu trước khi thử lại.")) : ne.current ? p("Chưa xác minh được kết quả lưu. Đối chiếu thao tác đang chờ trước khi tiếp tục.") : (C.current = null, S(!1), re(!1), p("Chưa chuẩn bị được lần lưu. Anh/chị thử kiểm tra lại nhé."));
			}
		} finally {
			l() && (se.current = !1, h(!1));
		}
	}
	async function le() {
		if (C.current) return ce();
		if (!e || ad?.currentUser?.uid !== e.uid || !ne.current || se.current || t || o.locked) return;
		let n = ne.current, r = e.uid, i = oe.current, a = () => i === oe.current && u.current === r && ad?.currentUser?.uid === r;
		se.current = !0, h(!0), p("");
		try {
			let e = Id.parse(await Y("customerSaveResolve", n));
			if (!a()) return;
			if (e.status === "saved" && (e.result.version !== n.expectedVersion + 1 || n.action === "saveProfile" && e.result.id !== r)) throw Error("INVALID_RECOVERY_RESULT");
			if (await /* @__PURE__ */ zd(r, n), !a()) return;
			ne.current = null, S(!1), te(e.status === "saved" ? "Đã xác minh lần lưu trước thành công. Kiểm tra thông tin đã lưu trước khi cập nhật tiếp." : "Lần lưu trước chưa hoàn tất. Anh/chị có thể gửi lại thông tin.");
		} catch {
			a() && p("Chưa đối chiếu được kết quả. Giữ nguyên lần lưu đang chờ và thử lại.");
		} finally {
			a() && (se.current = !1, h(!1));
		}
	}
	function ue(e, t) {
		let n = e === "profile" ? o.profileError : o.addressesError, r = e === "profile" ? o.profileReady : o.addressesReady;
		return n ? /* @__PURE__ */ (0, X.jsxs)("div", {
			className: "profileNotice",
			role: "alert",
			children: [/* @__PURE__ */ (0, X.jsx)("p", { children: n }), /* @__PURE__ */ (0, X.jsx)("button", {
				type: "button",
				disabled: m,
				onClick: () => v((e) => e + 1),
				children: "Thử tải lại"
			})]
		}) : r ? null : /* @__PURE__ */ (0, X.jsx)(Td, {
			className: "profileHint",
			overlay: t,
			children: e === "profile" ? "Đang tải hồ sơ…" : "Đang tải địa chỉ…"
		});
	}
	return /* @__PURE__ */ (0, X.jsxs)("section", {
		className: "page profilePage",
		"aria-labelledby": `${r}-profileTitle`,
		children: [
			/* @__PURE__ */ (0, X.jsxs)("header", {
				className: "profileHeader",
				children: [/* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("h1", {
					id: `${r}-profileTitle`,
					children: "Hồ sơ và địa chỉ"
				}), /* @__PURE__ */ (0, X.jsx)("p", { children: "Thông tin cá nhân và địa chỉ nhận hàng của bạn." })] }), e && /* @__PURE__ */ (0, X.jsxs)(bn, {
					className: "profileOrderLink",
					to: "/account",
					children: ["Đơn hàng của tôi ", /* @__PURE__ */ (0, X.jsx)("span", {
						"aria-hidden": "true",
						children: "→"
					})]
				})]
			}),
			/* @__PURE__ */ (0, X.jsx)(gd, {}),
			e ? /* @__PURE__ */ (0, X.jsxs)("div", {
				className: "profileFlow",
				children: [
					/* @__PURE__ */ (0, X.jsx)("nav", {
						className: "profileStepper profileStepperNotifications",
						"aria-label": "Các bước quản lý hồ sơ",
						children: [
							1,
							2,
							3
						].map((e) => /* @__PURE__ */ (0, X.jsxs)("button", {
							type: "button",
							disabled: m,
							"aria-current": y === e ? "step" : void 0,
							"aria-controls": e === 1 ? `${r}-profilePersonalPanel` : e === 2 ? `${r}-profileAddressPanel` : `${r}-profileNotificationPanel`,
							onClick: () => b(e),
							children: [/* @__PURE__ */ (0, X.jsx)("span", {
								className: "profileStepNumber",
								"aria-hidden": "true",
								children: e
							}), /* @__PURE__ */ (0, X.jsx)("span", { children: e === 1 ? "Thông tin cá nhân" : e === 2 ? "Địa chỉ nhận hàng" : "Thông báo" })]
						}, e))
					}),
					/* @__PURE__ */ (0, X.jsx)("div", {
						id: `${r}-profileNotificationPanel`,
						hidden: y !== 3,
						children: y === 3 && /* @__PURE__ */ (0, X.jsx)(hd, {
							user: e,
							blocked: t || m || x || o.locked,
							onPendingChange: n
						}, e.uid)
					}),
					/* @__PURE__ */ (0, X.jsxs)("form", {
						id: `${r}-profilePersonalPanel`,
						hidden: y !== 1,
						className: "form profileCard",
						onSubmit: (e) => void ce(e, "saveProfile"),
						"aria-labelledby": `${r}-personalTitle`,
						children: [
							/* @__PURE__ */ (0, X.jsx)("header", {
								className: "profileCardHeading",
								children: /* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("h2", {
									id: `${r}-personalTitle`,
									children: "Thông tin cá nhân"
								}), /* @__PURE__ */ (0, X.jsx)("p", { children: "Cập nhật thông tin cá nhân của bạn." })] })
							}),
							ue("profile", y === 1),
							/* @__PURE__ */ (0, X.jsxs)("fieldset", {
								disabled: m || t || x || !w || !o.profileReady || o.locked,
								children: [
									/* @__PURE__ */ (0, X.jsxs)("label", { children: [/* @__PURE__ */ (0, X.jsxs)("span", {
										className: "formLabelText",
										children: [
											"Tên hiển thị",
											" ",
											/* @__PURE__ */ (0, X.jsx)("span", {
												className: "requiredMark",
												"aria-hidden": "true",
												children: "*"
											})
										]
									}), /* @__PURE__ */ (0, X.jsx)("input", {
										name: "displayName",
										autoComplete: "name",
										value: s.displayName,
										onChange: (e) => d({
											...s,
											displayName: e.target.value
										}),
										required: !0,
										maxLength: 120
									})] }),
									/* @__PURE__ */ (0, X.jsxs)("label", { children: ["Tên hộ kinh doanh", /* @__PURE__ */ (0, X.jsx)("input", {
										name: "businessName",
										autoComplete: "organization",
										maxLength: 160,
										value: s.businessName,
										onChange: (e) => d({
											...s,
											businessName: e.target.value
										})
									})] }),
									/* @__PURE__ */ (0, X.jsx)("button", {
										type: "button",
										onClick: () => b(3),
										children: "Quản lý thông báo →"
									}),
									/* @__PURE__ */ (0, X.jsx)("div", {
										className: "profileFormFooter",
										children: /* @__PURE__ */ (0, X.jsx)("button", {
											className: "primary",
											disabled: m,
											children: "Lưu hồ sơ"
										})
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, X.jsxs)("div", {
						id: `${r}-profileAddressPanel`,
						hidden: y !== 2,
						className: "profileAddressColumn",
						children: [
							!o.profileReady && ue("profile", y === 2),
							/* @__PURE__ */ (0, X.jsxs)("section", {
								className: "profileCard",
								"aria-labelledby": `${r}-addressesTitle`,
								children: [
									/* @__PURE__ */ (0, X.jsx)("header", {
										className: "profileCardHeading",
										children: /* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("h2", {
											id: `${r}-addressesTitle`,
											children: "Địa chỉ đã lưu"
										}), /* @__PURE__ */ (0, X.jsx)("p", { children: "Thông tin người nhận cho đơn hàng của bạn." })] })
									}),
									o.locked ? /* @__PURE__ */ (0, X.jsx)("p", {
										className: "profileHint",
										children: "Địa chỉ không khả dụng khi tài khoản bị khóa."
									}) : ue("addresses", y === 2),
									!o.locked && o.addressesReady && !o.profileReady && /* @__PURE__ */ (0, X.jsx)("p", {
										className: "profileHint",
										children: o.profileError ? "Địa chỉ sẽ hiển thị khi tải lại hồ sơ thành công." : "Đang xác minh hồ sơ để hiển thị địa chỉ…"
									}),
									o.profileReady && o.addressesReady && !o.locked && (l.length ? /* @__PURE__ */ (0, X.jsx)("div", {
										className: "profileAddressList",
										children: l.map((e) => /* @__PURE__ */ (0, X.jsxs)("article", {
											className: "profileAddress",
											children: [/* @__PURE__ */ (0, X.jsx)("strong", { children: e.recipient }), /* @__PURE__ */ (0, X.jsx)("p", { children: e.address })]
										}, e.id))
									}) : /* @__PURE__ */ (0, X.jsx)("p", {
										className: "profileEmpty",
										children: "Chưa có địa chỉ đã lưu. Thêm địa chỉ nhận hàng bên dưới."
									}))
								]
							}),
							/* @__PURE__ */ (0, X.jsxs)("form", {
								className: "form profileCard",
								onSubmit: (e) => void ce(e, "saveAddress"),
								"aria-labelledby": `${r}-newAddressTitle`,
								children: [/* @__PURE__ */ (0, X.jsx)("header", {
									className: "profileCardHeading",
									children: /* @__PURE__ */ (0, X.jsx)("div", { children: /* @__PURE__ */ (0, X.jsx)("h2", {
										id: `${r}-newAddressTitle`,
										children: "Thêm địa chỉ nhận hàng"
									}) })
								}), /* @__PURE__ */ (0, X.jsxs)("fieldset", {
									disabled: m || t || x || !w || !o.profileReady || !o.addressesReady || o.locked,
									children: [
										/* @__PURE__ */ (0, X.jsxs)("div", {
											className: "profileFieldsRow",
											children: [/* @__PURE__ */ (0, X.jsxs)("label", { children: [/* @__PURE__ */ (0, X.jsxs)("span", {
												className: "formLabelText",
												children: [
													"Người nhận",
													" ",
													/* @__PURE__ */ (0, X.jsx)("span", {
														className: "requiredMark",
														"aria-hidden": "true",
														children: "*"
													})
												]
											}), /* @__PURE__ */ (0, X.jsx)("input", {
												name: "recipient",
												autoComplete: "shipping name",
												minLength: 2,
												maxLength: 120,
												required: !0
											})] }), /* @__PURE__ */ (0, X.jsxs)("label", { children: [/* @__PURE__ */ (0, X.jsxs)("span", {
												className: "formLabelText",
												children: [
													"Số điện thoại",
													" ",
													/* @__PURE__ */ (0, X.jsx)("span", {
														className: "requiredMark",
														"aria-hidden": "true",
														children: "*"
													})
												]
											}), /* @__PURE__ */ (0, X.jsx)("input", {
												name: "phone",
												type: "tel",
												autoComplete: "shipping tel",
												minLength: 8,
												maxLength: 20,
												required: !0
											})] })]
										}),
										/* @__PURE__ */ (0, X.jsxs)("label", { children: [/* @__PURE__ */ (0, X.jsxs)("span", {
											className: "formLabelText",
											children: [
												"Địa chỉ",
												" ",
												/* @__PURE__ */ (0, X.jsx)("span", {
													className: "requiredMark",
													"aria-hidden": "true",
													children: "*"
												})
											]
										}), /* @__PURE__ */ (0, X.jsx)("textarea", {
											name: "address",
											autoComplete: "shipping street-address",
											minLength: 10,
											maxLength: 500,
											required: !0,
											rows: 3
										})] }),
										/* @__PURE__ */ (0, X.jsx)("div", {
											className: "profileFormFooter",
											children: /* @__PURE__ */ (0, X.jsx)("button", {
												className: "primary",
												disabled: m,
												children: "Lưu địa chỉ"
											})
										})
									]
								})]
							}, `${e.uid}:${o.locked}`)
						]
					})
				]
			}) : /* @__PURE__ */ (0, X.jsx)("p", {
				className: "profileNotice",
				children: "Đăng nhập để quản lý thông tin của bạn."
			}),
			e && o.uid === i.uid && /* @__PURE__ */ (0, X.jsxs)("div", {
				className: "profileSaveStatus",
				"aria-live": "polite",
				children: [
					m && /* @__PURE__ */ (0, X.jsx)(Td, {
						overlay: !1,
						children: "Đang lưu thông tin…"
					}),
					ee && /* @__PURE__ */ (0, X.jsx)("p", {
						role: "status",
						className: "profileHint",
						children: ee
					}),
					f && /* @__PURE__ */ (0, X.jsx)("p", {
						role: "alert",
						className: "profileNotice",
						children: f
					})
				]
			}),
			e && x && !o.locked && /* @__PURE__ */ (0, X.jsx)("button", {
				type: "button",
				disabled: m || t || !w,
				onClick: () => void le(),
				children: "Đối chiếu thao tác đang chờ"
			}),
			e && !w && /* @__PURE__ */ (0, X.jsx)("button", {
				type: "button",
				disabled: m,
				onClick: () => ae((e) => e + 1),
				children: "Thử kiểm tra lại"
			}),
			/* @__PURE__ */ (0, X.jsxs)("footer", {
				className: "profilePrivacy",
				children: [
					/* @__PURE__ */ (0, X.jsx)("span", { children: "Dữ liệu cá nhân" }),
					/* @__PURE__ */ (0, X.jsx)(bn, {
						to: "/support?topic=data-export",
						children: "Yêu cầu xuất dữ liệu"
					}),
					/* @__PURE__ */ (0, X.jsx)(bn, {
						to: "/support?topic=data-deletion",
						children: "Yêu cầu xóa dữ liệu"
					})
				]
			})
		]
	});
}
//#endregion
//#region \0emailR2Routes
var Vd = () => {};
//#endregion
//#region src/features/account/AccountRail.tsx
function Hd({ kind: e }) {
	return /* @__PURE__ */ (0, X.jsx)("svg", {
		width: "20",
		height: "20",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.7",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: e === "orders" ? /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [/* @__PURE__ */ (0, X.jsx)("path", { d: "m12 3 9 5-9 5-9-5 9-5Z" }), /* @__PURE__ */ (0, X.jsx)("path", { d: "M3 8v9l9 5 9-5V8M12 13v9M7 5l9 5" })] }) : e === "shipments" ? /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [
			/* @__PURE__ */ (0, X.jsx)("path", { d: "M3 5h11v12H3zM14 9h4l3 4v4h-7" }),
			/* @__PURE__ */ (0, X.jsx)("circle", {
				cx: "7",
				cy: "18",
				r: "2"
			}),
			/* @__PURE__ */ (0, X.jsx)("circle", {
				cx: "18",
				cy: "18",
				r: "2"
			})
		] }) : e === "notifications" ? /* @__PURE__ */ (0, X.jsx)("path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" }) : e === "documents" ? /* @__PURE__ */ (0, X.jsx)(X.Fragment, { children: /* @__PURE__ */ (0, X.jsx)("path", { d: "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6" }) }) : e === "profile" ? /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [/* @__PURE__ */ (0, X.jsx)("circle", {
			cx: "12",
			cy: "8",
			r: "4"
		}), /* @__PURE__ */ (0, X.jsx)("path", { d: "M4 21v-2a8 8 0 0 1 16 0v2" })] }) : e === "security" ? /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [/* @__PURE__ */ (0, X.jsx)("path", { d: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" }), /* @__PURE__ */ (0, X.jsx)("path", { d: "m9 12 2 2 4-4" })] }) : /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [
			/* @__PURE__ */ (0, X.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "9"
			}),
			/* @__PURE__ */ (0, X.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "4"
			}),
			/* @__PURE__ */ (0, X.jsx)("path", { d: "m6 6 3 3m6 6 3 3M6 18l3-3m6-6 3-3" })
		] })
	});
}
function Ud({ active: e }) {
	return /* @__PURE__ */ (0, X.jsxs)("aside", {
		className: "customerRail",
		onPointerOver: Vd,
		onFocusCapture: Vd,
		children: [
			/* @__PURE__ */ (0, X.jsx)("span", {
				className: "customerRailLabel",
				children: "TÀI KHOẢN"
			}),
			/* @__PURE__ */ (0, X.jsxs)("nav", {
				"aria-label": "Không gian khách hàng",
				children: [
					/* @__PURE__ */ (0, X.jsxs)(bn, {
						to: "/account",
						"aria-current": e === "orders" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(Hd, { kind: "orders" }), "Đơn của tôi"]
					}),
					/* @__PURE__ */ (0, X.jsxs)(bn, {
						to: "/account?view=shipments",
						"aria-current": e === "shipments" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(Hd, { kind: "shipments" }), "Vận chuyển"]
					}),
					/* @__PURE__ */ (0, X.jsxs)(bn, {
						to: "/account?view=notifications",
						"aria-current": e === "notifications" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(Hd, { kind: "notifications" }), "Thông báo"]
					}),
					/* @__PURE__ */ (0, X.jsx)("div", { className: "customerRailDivider" }),
					/* @__PURE__ */ (0, X.jsxs)(bn, {
						className: "customerSecondary",
						to: "/account/documents",
						children: [/* @__PURE__ */ (0, X.jsx)(Hd, { kind: "documents" }), "Chứng từ của tôi"]
					}),
					/* @__PURE__ */ (0, X.jsxs)(bn, {
						className: "customerSecondary",
						to: "/account/profile",
						"aria-current": e === "profile" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(Hd, { kind: "profile" }), "Hồ sơ và địa chỉ"]
					}),
					/* @__PURE__ */ (0, X.jsxs)(bn, {
						className: "customerSecondary",
						to: "/account/security",
						"aria-current": e === "security" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(Hd, { kind: "security" }), "Bảo mật tài khoản"]
					})
				]
			}),
			/* @__PURE__ */ (0, X.jsxs)(bn, {
				className: "customerHelp",
				to: "/support",
				children: [/* @__PURE__ */ (0, X.jsxs)("span", {
					className: "customerHelpLabel",
					children: [/* @__PURE__ */ (0, X.jsx)(Hd, { kind: "support" }), "Cần hỗ trợ?"]
				}), /* @__PURE__ */ (0, X.jsx)("svg", {
					width: "20",
					height: "20",
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.7",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, X.jsx)("path", { d: "M5 12h14m-6-6 6 6-6 6" })
				})]
			})
		]
	});
}
//#endregion
//#region docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-R2/entry.tsx
function Wd({ user: e }) {
	let t = ud(e, "checkout");
	return /* @__PURE__ */ (0, X.jsxs)("section", {
		className: "purchaseCard recipientForm fixtureCheckout",
		"aria-label": "Checkout notification choices",
		children: [
			/* @__PURE__ */ (0, X.jsx)("h1", { children: "Tùy chọn nhận tin" }),
			/* @__PURE__ */ (0, X.jsx)("p", {
				className: "fixtureDisclosure",
				children: "CheckoutNotificationChoices thật; khung checkout được cô lập để không dùng giỏ hàng hay luồng thanh toán."
			}),
			/* @__PURE__ */ (0, X.jsx)(md, { controller: t }),
			/* @__PURE__ */ (0, X.jsx)("div", {
				className: "profileFormFooter",
				children: /* @__PURE__ */ (0, X.jsx)("button", {
					type: "button",
					className: "primary",
					disabled: !t.view || !t.dirty || t.busy || t.uncertain,
					onClick: () => void t.save(),
					children: "Lưu tùy chọn"
				})
			}),
			/* @__PURE__ */ (0, X.jsx)(pd, { controller: t })
		]
	});
}
function Gd() {
	(0, _.useSyncExternalStore)(id.subscribe, id.snapshot);
	let e = id.user(), t = new URLSearchParams(location.search).get("screen") || "profile";
	return /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [
		/* @__PURE__ */ (0, X.jsxs)("aside", {
			className: "fixtureBar",
			"aria-label": "Fixture controls",
			children: [/* @__PURE__ */ (0, X.jsx)("p", { children: "QA fixture · Dữ liệu minh họa trong RAM · Không gửi tin, không lưu tài khoản" }), /* @__PURE__ */ (0, X.jsxs)("div", {
				className: "fixtureControls",
				children: [
					/* @__PURE__ */ (0, X.jsx)("button", {
						type: "button",
						"aria-pressed": id.owner() === "owner-A",
						onClick: () => id.setOwner("owner-A"),
						children: "Fixture owner A"
					}),
					/* @__PURE__ */ (0, X.jsx)("button", {
						type: "button",
						"aria-pressed": id.owner() === "owner-B",
						onClick: () => id.setOwner("owner-B"),
						children: "Fixture owner B"
					}),
					/* @__PURE__ */ (0, X.jsx)("button", {
						type: "button",
						disabled: !id.pendingCount(),
						onClick: () => id.resolvePending(),
						children: "Resolve pending response"
					}),
					/* @__PURE__ */ (0, X.jsx)("output", {
						id: "fixture-owner",
						"aria-label": "Fixture owner",
						children: id.owner()
					}),
					/* @__PURE__ */ (0, X.jsxs)("output", {
						id: "fixture-pending",
						"aria-label": "Fixture pending responses",
						children: [
							id.pendingCount(),
							" · ",
							id.pendingOwner()
						]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, X.jsx)("main", {
			id: "main",
			children: t === "checkout" ? /* @__PURE__ */ (0, X.jsx)("div", {
				className: "accountPage",
				children: /* @__PURE__ */ (0, X.jsx)(Wd, { user: e })
			}) : t === "token" ? /* @__PURE__ */ (0, X.jsx)("div", {
				className: "accountPage",
				children: /* @__PURE__ */ (0, X.jsx)(gd, {})
			}) : t === "preferences" ? /* @__PURE__ */ (0, X.jsx)("div", {
				className: "accountPage",
				children: /* @__PURE__ */ (0, X.jsx)(hd, { user: e })
			}) : /* @__PURE__ */ (0, X.jsxs)("section", {
				className: "accountWorkspace",
				children: [/* @__PURE__ */ (0, X.jsx)(Ud, { active: "profile" }), /* @__PURE__ */ (0, X.jsx)("div", {
					className: "accountPage",
					children: /* @__PURE__ */ (0, X.jsx)(Bd, { user: e })
				})]
			})
		}),
		/* @__PURE__ */ (0, X.jsxs)("details", {
			className: "fixtureTrace",
			open: !0,
			children: [/* @__PURE__ */ (0, X.jsx)("summary", { children: "Fixture call trace · action / owner / operationId" }), /* @__PURE__ */ (0, X.jsx)("ol", {
				id: "fixture-call-trace",
				"aria-label": "Fixture call trace",
				children: id.calls().map((e, t) => /* @__PURE__ */ (0, X.jsxs)("li", {
					"data-action": e.action,
					"data-owner": e.owner,
					"data-operation-id": e.operationId,
					children: [
						e.action,
						" · ",
						e.owner,
						" · ",
						e.operationId
					]
				}, t))
			})]
		})
	] });
}
(0, Zu.createRoot)(document.getElementById("emailContentRoot")).render(/* @__PURE__ */ (0, X.jsx)(It, { children: /* @__PURE__ */ (0, X.jsx)(Gd, {}) }));
//#endregion
