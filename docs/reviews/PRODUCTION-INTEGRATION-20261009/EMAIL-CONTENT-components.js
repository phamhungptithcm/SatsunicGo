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
	function x(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	var S = x.prototype = new b();
	S.constructor = x, _(S, y.prototype), S.isPureReactComponent = !0;
	var C = Array.isArray;
	function w() {}
	var T = {
		H: null,
		A: null,
		T: null,
		S: null
	}, E = Object.prototype.hasOwnProperty;
	function D(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function ee(e, t) {
		return D(e.type, t, e.props);
	}
	function te(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function ne(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var re = /\/+/g;
	function ie(e, t) {
		return typeof e == "object" && e && e.key != null ? ne("" + e.key) : t.toString(36);
	}
	function ae(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(w, w) : (e.status = "pending", e.then(function(t) {
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
	function oe(e, r, i, a, o) {
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
				case d: return c = e._init, oe(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + ie(e, 0) : a, C(o) ? (i = "", c != null && (i = c.replace(re, "$&/") + "/"), oe(o, r, i, "", function(e) {
			return e;
		})) : o != null && (te(o) && (o = ee(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(re, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (C(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + ie(a, u), c += oe(a, r, i, s, o);
		else if (u = h(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + ie(a, u++), c += oe(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return oe(ae(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function se(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return oe(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function ce(e) {
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
	var le = typeof reportError == "function" ? reportError : function(e) {
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
	function ue(e) {
		var t = T.T, n = {};
		n.types = t === null ? null : t.types, T.T = n;
		try {
			var r = e(), i = T.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(w, le);
		} catch (e) {
			le(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), T.T = t;
		}
	}
	function de(e) {
		var t = T.T;
		if (t !== null) {
			var n = t.types;
			n === null ? t.types = [e] : n.indexOf(e) === -1 && n.push(e);
		} else ue(de.bind(null, e));
	}
	var fe = {
		map: se,
		forEach: function(e, t, n) {
			se(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return se(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return se(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!te(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = fe, e.Component = y, e.Fragment = r, e.Profiler = a, e.PureComponent = x, e.StrictMode = i, e.Suspense = l, e.ViewTransition = p, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = T, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return T.H.useMemoCache(e);
		}
	}, e.addTransitionType = de, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = _({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !E.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return D(e.type, i, r);
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
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) E.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return D(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = te, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: ce
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = ue, e.unstable_useCacheRefresh = function() {
		return T.H.useCacheRefresh();
	}, e.use = function(e) {
		return T.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return T.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return T.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return T.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return T.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return T.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return T.H.useEffectEvent(e);
	}, e.useId = function() {
		return T.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return T.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return T.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return T.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return T.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return T.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return T.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return T.H.useRef(e);
	}, e.useState = function(e) {
		return T.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return T.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return T.H.useTransition();
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
	function x(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, S || (S = !0, ee());
			else {
				var t = n(l);
				t !== null && re(x, t.startTime - e);
			}
		}
	}
	var S = !1, C = -1, w = 5, T = -1;
	function E() {
		return g ? !0 : !(e.unstable_now() - T < w);
	}
	function D() {
		if (g = !1, S) {
			var t = e.unstable_now();
			T = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && E());) {
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
								u !== null && re(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? ee() : S = !1;
			}
		}
	}
	var ee;
	if (typeof y == "function") ee = function() {
		y(D);
	};
	else if (typeof MessageChannel < "u") {
		var te = new MessageChannel(), ne = te.port2;
		te.port1.onmessage = D, ee = function() {
			ne.postMessage(null);
		};
	} else ee = function() {
		_(D, 0);
	};
	function re(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
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
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, re(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, ee()))), r;
	}, e.unstable_shouldYield = E, e.unstable_wrapCallback = function(e) {
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
	var x = null, S = null;
	function C(e, t, n) {
		return e === n || e === t && (x = e, !0);
	}
	function w(e, t, n) {
		return e === n ? (S = e, !1) : e === t && (S !== null && (x = e), !0);
	}
	function T(e) {
		if (e === null) return null;
		do
			e = e === null ? null : e.return;
		while (e && e.tag !== 5 && e.tag !== 27 && e.tag !== 3);
		return e || null;
	}
	function E(e, t, n) {
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
	var D = Object.assign, ee = Symbol.for("react.element"), te = Symbol.for("react.transitional.element"), ne = Symbol.for("react.portal"), re = Symbol.for("react.fragment"), ie = Symbol.for("react.strict_mode"), ae = Symbol.for("react.profiler"), oe = Symbol.for("react.consumer"), se = Symbol.for("react.context"), ce = Symbol.for("react.forward_ref"), le = Symbol.for("react.suspense"), ue = Symbol.for("react.suspense_list"), de = Symbol.for("react.memo"), fe = Symbol.for("react.lazy"), pe = Symbol.for("react.activity"), me = Symbol.for("react.legacy_hidden"), he = Symbol.for("react.memo_cache_sentinel"), ge = Symbol.for("react.view_transition"), _e = Symbol.for("react.recoverable"), ve = Symbol.iterator;
	function ye(e) {
		return typeof e != "object" || !e ? null : (e = ve && e[ve] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var be = Symbol.for("react.client.reference");
	function xe(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === be ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case re: return "Fragment";
			case ae: return "Profiler";
			case ie: return "StrictMode";
			case le: return "Suspense";
			case ue: return "SuspenseList";
			case pe: return "Activity";
			case ge: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case ne: return "Portal";
			case se: return e.displayName || "Context";
			case oe: return (e._context.displayName || "Context") + ".Consumer";
			case ce:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case de: return t = e.displayName || null, t === null ? xe(e.type) || "Memo" : t;
			case fe:
				t = e._payload, e = e._init;
				try {
					return xe(e(t));
				} catch {}
		}
		return null;
	}
	var Se = Array.isArray, O = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, k = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, Ce = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, we = [], Te = -1;
	function Ee(e) {
		return { current: e };
	}
	function A(e) {
		0 > Te || (e.current = we[Te], we[Te] = null, Te--);
	}
	function j(e, t) {
		Te++, we[Te] = e.current, e.current = t;
	}
	var De = Ee(null), Oe = Ee(null), ke = Ee(null), Ae = Ee(null);
	function je(e, t) {
		switch (j(ke, t), j(Oe, e), j(De, null), t.nodeType) {
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
		A(De), j(De, e);
	}
	function Me() {
		A(De), A(Oe), A(ke);
	}
	function Ne(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, j(Ae, e)), t = De.current;
		var n = dp(t, e.type);
		t !== n && (j(Oe, e), j(De, n));
	}
	function Pe(e) {
		Oe.current === e && (A(De), A(Oe)), Ae.current === e && (A(Ae), sh._currentValue = Ce);
	}
	var Fe, Ie;
	function Le(e) {
		if (Fe === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			Fe = t && t[1] || "", Ie = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + Fe + e + Ie;
	}
	var Re = !1;
	function ze(e, t) {
		if (!e || Re) return "";
		Re = !0;
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
			Re = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? Le(n) : "";
	}
	function Be(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return Le(e.type);
			case 16: return Le("Lazy");
			case 13: return e.child !== t && t !== null ? Le("Suspense Fallback") : Le("Suspense");
			case 19: return Le("SuspenseList");
			case 0:
			case 15: return ze(e.type, !1);
			case 11: return ze(e.type.render, !1);
			case 1: return ze(e.type, !0);
			case 31: return Le("Activity");
			case 30: return Le("ViewTransition");
			default: return "";
		}
	}
	function Ve(e) {
		try {
			var t = "", n = null;
			do
				t += Be(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var He = Object.prototype.hasOwnProperty, Ue = t.unstable_scheduleCallback, We = t.unstable_cancelCallback, Ge = t.unstable_shouldYield, Ke = t.unstable_requestPaint, qe = t.unstable_now, Je = t.unstable_getCurrentPriorityLevel, Ye = t.unstable_ImmediatePriority, Xe = t.unstable_UserBlockingPriority, Ze = t.unstable_NormalPriority, Qe = t.unstable_LowPriority, $e = t.unstable_IdlePriority, et = t.log, tt = t.unstable_setDisableYieldValue, nt = null, rt = null;
	function it(e) {
		if (typeof et == "function" && tt(e), rt && typeof rt.setStrictMode == "function") try {
			rt.setStrictMode(nt, e);
		} catch {}
	}
	var at = Math.clz32 ? Math.clz32 : ct, ot = Math.log, st = Math.LN2;
	function ct(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (ot(e) / st | 0) | 0;
	}
	var lt = 256, ut = 262144, dt = 4194304;
	function ft(e) {
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
	function pt(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = ft(n))) : i = ft(o) : i = ft(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = ft(n))) : i = ft(o)) : i = ft(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function mt(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function ht(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - at(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function gt(e, t) {
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
	function _t() {
		var e = dt;
		return dt <<= 1, !(dt & 62914560) && (dt = 4194304), e;
	}
	function vt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function yt(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function bt(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - at(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && xt(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function xt(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - at(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function St(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - at(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function Ct(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : wt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function wt(e) {
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
	function Tt(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function Et() {
		var e = k.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function Dt(e, t) {
		var n = k.p;
		try {
			return k.p = e, t();
		} finally {
			k.p = n;
		}
	}
	var Ot = Math.random().toString(36).slice(2), kt = "__reactFiber$" + Ot, At = "__reactProps$" + Ot, jt = "__reactContainer$" + Ot, Mt = "__reactEvents$" + Ot, Nt = "__reactListeners$" + Ot, Pt = "__reactHandles$" + Ot, Ft = "__reactResources$" + Ot, It = "__reactMarker$" + Ot, Lt = "__reactLoad$" + Ot;
	function Rt(e) {
		delete e[kt], delete e[At], delete e[Nt], delete e[Pt];
	}
	function zt(e) {
		var t;
		if (t = e[kt]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[jt] || n[kt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[kt]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Bt(e) {
		if (e = e[kt] || e[jt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function Vt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Ht(e) {
		var t = e[Ft];
		return t ||= e[Ft] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function Ut(e) {
		e[It] = !0;
	}
	function Wt(e) {
		e[Lt] = void 0;
	}
	var Gt = /* @__PURE__ */ new Set(), Kt = {};
	function qt(e, t) {
		Jt(e, t), Jt(e + "Capture", t);
	}
	function Jt(e, t) {
		for (Kt[e] = t, e = 0; e < t.length; e++) Gt.add(t[e]);
	}
	var Yt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Xt = {}, Zt = {};
	function Qt(e) {
		return He.call(Zt, e) ? !0 : He.call(Xt, e) ? !1 : Yt.test(e) ? Zt[e] = !0 : (Xt[e] = !0, !1);
	}
	var M = !1;
	function $t() {
		var e = M;
		return M = !1, e;
	}
	function en(e, t, n) {
		if (Qt(t)) {
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
	function tn(e, t, n) {
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
	function nn(e, t, n, r) {
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
	function rn(e) {
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
	function an(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function on(e, t, n) {
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
	function sn(e) {
		if (!e._valueTracker) {
			var t = an(e) ? "checked" : "value";
			e._valueTracker = on(e, t, "" + e[t]);
		}
	}
	function cn(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = an(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var ln = /[\n"\\]/g;
	function un(e) {
		return e.replace(ln, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function dn(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + rn(t)) : e.value !== "" + rn(t) && (e.value = "" + rn(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : pn(e, rn(n)) : o === "number" && e.value == t ? pn(e, rn(e.value)) : pn(e, rn(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + rn(s) : e.removeAttribute("name");
	}
	function fn(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				sn(e);
				return;
			}
			n = n == null ? "" : "" + rn(n), t = t == null ? n : "" + rn(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), sn(e);
	}
	function pn(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function mn(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + rn(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function hn(e, t, n) {
		if (t != null && (t = "" + rn(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + rn(n);
	}
	function gn(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (Se(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = rn(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), sn(e);
	}
	function _n(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var vn = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function yn(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || vn.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function bn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", M = !0);
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && (yn(e, a, r), M = !0);
		} else for (var o in t) t.hasOwnProperty(o) && yn(e, o, t[o]);
	}
	function xn(e) {
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
	var Sn = /* @__PURE__ */ new Map([
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
	]), Cn = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function wn(e) {
		return Cn.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function Tn() {}
	var En = null;
	function Dn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var On = null, kn = null;
	function An(e) {
		var t = Bt(e);
		if (t && (e = t.stateNode)) {
			var n = e[At] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (dn(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + un("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[At] || null;
								if (!a) throw Error(i(90));
								dn(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && cn(r);
					}
					break a;
				case "textarea":
					hn(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && mn(e, !!n.multiple, t, !1);
			}
		}
	}
	var jn = !1;
	function Mn(e, t, n) {
		if (jn) return e(t, n);
		jn = !0;
		try {
			return e(t);
		} finally {
			if (jn = !1, (On !== null || kn !== null) && (zd(), On && (t = On, e = kn, kn = On = null, An(t), e))) for (t = 0; t < e.length; t++) An(e[t]);
		}
	}
	function Nn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[At] || null;
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
	var Pn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, Fn = !1;
	if (Pn) try {
		var In = {};
		Object.defineProperty(In, "passive", { get: function() {
			Fn = !0;
		} }), window.addEventListener("test", In, In), window.removeEventListener("test", In, In);
	} catch {
		Fn = !1;
	}
	var Ln = null, Rn = null, zn = null;
	function Bn() {
		if (zn) return zn;
		var e, t = Rn, n = t.length, r, i = "value" in Ln ? Ln.value : Ln.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return zn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Vn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Hn() {
		return !0;
	}
	function Un() {
		return !1;
	}
	function Wn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Hn : Un, this.isPropagationStopped = Un, this;
		}
		return D(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Hn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Hn);
			},
			persist: function() {},
			isPersistent: Hn
		}), t;
	}
	var Gn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Kn = Wn(Gn), qn = D({}, Gn, {
		view: 0,
		detail: 0
	}), Jn = Wn(qn), Yn, Xn, Zn, Qn = D({}, qn, {
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
		getModifierState: cr,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Zn && (Zn && e.type === "mousemove" ? (Yn = e.screenX - Zn.screenX, Xn = e.screenY - Zn.screenY) : Xn = Yn = 0, Zn = e), Yn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Xn;
		}
	}), $n = Wn(Qn), er = Wn(D({}, Qn, { dataTransfer: 0 })), tr = Wn(D({}, qn, { relatedTarget: 0 })), nr = Wn(D({}, Gn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), N = Wn(D({}, Gn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), rr = Wn(D({}, Gn, { data: 0 })), ir = {
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
	}, ar = {
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
	}, or = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function sr(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = or[e]) ? !!t[e] : !1;
	}
	function cr() {
		return sr;
	}
	var lr = Wn(D({}, qn, {
		key: function(e) {
			if (e.key) {
				var t = ir[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Vn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? ar[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: cr,
		charCode: function(e) {
			return e.type === "keypress" ? Vn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Vn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), ur = Wn(D({}, Qn, {
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
	})), dr = Wn(D({}, Gn, { submitter: 0 })), fr = Wn(D({}, qn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: cr
	})), pr = Wn(D({}, Gn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), mr = Wn(D({}, Qn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), hr = Wn(D({}, Gn, {
		newState: 0,
		oldState: 0,
		source: 0
	})), gr = [
		9,
		13,
		27,
		32
	], _r = Pn && "CompositionEvent" in window, vr = null;
	Pn && "documentMode" in document && (vr = document.documentMode);
	var yr = Pn && "TextEvent" in window && !vr, br = Pn && (!_r || vr && 8 < vr && 11 >= vr), xr = " ", Sr = !1;
	function Cr(e, t) {
		switch (e) {
			case "keyup": return gr.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function wr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var Tr = !1;
	function Er(e, t) {
		switch (e) {
			case "compositionend": return wr(t);
			case "keypress": return t.which === 32 ? (Sr = !0, xr) : null;
			case "textInput": return e = t.data, e === xr && Sr ? null : e;
			default: return null;
		}
	}
	function Dr(e, t) {
		if (Tr) return e === "compositionend" || !_r && Cr(e, t) ? (e = Bn(), zn = Rn = Ln = null, Tr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return br && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var Or = {
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
	function kr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!Or[e.type] : t === "textarea";
	}
	function Ar(e, t, n, r) {
		On ? kn ? kn.push(r) : kn = [r] : On = r, t = Jf(t, "onChange"), 0 < t.length && (n = new Kn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var jr = null, Mr = null;
	function Nr(e) {
		Vf(e, 0);
	}
	function Pr(e) {
		if (cn(Vt(e))) return e;
	}
	function Fr(e, t) {
		if (e === "change") return t;
	}
	var P = !1;
	if (Pn) {
		var Ir;
		if (Pn) {
			var Lr = "oninput" in document;
			if (!Lr) {
				var Rr = document.createElement("div");
				Rr.setAttribute("oninput", "return;"), Lr = typeof Rr.oninput == "function";
			}
			Ir = Lr;
		} else Ir = !1;
		P = Ir && (!document.documentMode || 9 < document.documentMode);
	}
	function zr() {
		jr && (jr.detachEvent("onpropertychange", Br), Mr = jr = null);
	}
	function Br(e) {
		if (e.propertyName === "value" && Pr(Mr)) {
			var t = [];
			Ar(t, Mr, e, Dn(e)), Mn(Nr, t);
		}
	}
	function Vr(e, t, n) {
		e === "focusin" ? (zr(), jr = t, Mr = n, jr.attachEvent("onpropertychange", Br)) : e === "focusout" && zr();
	}
	function Hr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return Pr(Mr);
	}
	function F(e, t) {
		if (e === "click") return Pr(t);
	}
	function Ur(e, t) {
		if (e === "input" || e === "change") return Pr(t);
	}
	function Wr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Gr = typeof Object.is == "function" ? Object.is : Wr;
	function Kr(e, t) {
		if (Gr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!He.call(t, i) || !Gr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function qr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function Jr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Yr(e, t) {
		var n = Jr(e);
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
			n = Jr(n);
		}
	}
	function Xr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Xr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Zr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = qr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = qr(e.document);
		}
		return t;
	}
	function Qr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var $r = Pn && "documentMode" in document && 11 >= document.documentMode, ei = null, ti = null, ni = null, ri = !1;
	function ii(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		ri || ei == null || ei !== qr(r) || (r = ei, "selectionStart" in r && Qr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), ni && Kr(ni, r) || (ni = r, r = Jf(ti, "onSelect"), 0 < r.length && (t = new Kn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = ei)));
	}
	function ai(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var oi = {
		animationend: ai("Animation", "AnimationEnd"),
		animationiteration: ai("Animation", "AnimationIteration"),
		animationstart: ai("Animation", "AnimationStart"),
		transitionrun: ai("Transition", "TransitionRun"),
		transitionstart: ai("Transition", "TransitionStart"),
		transitioncancel: ai("Transition", "TransitionCancel"),
		transitionend: ai("Transition", "TransitionEnd")
	}, si = {}, ci = {};
	Pn && (ci = document.createElement("div").style, "AnimationEvent" in window || (delete oi.animationend.animation, delete oi.animationiteration.animation, delete oi.animationstart.animation), "TransitionEvent" in window || delete oi.transitionend.transition);
	function li(e) {
		if (si[e]) return si[e];
		if (!oi[e]) return e;
		var t = oi[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in ci) return si[e] = t[n];
		return e;
	}
	var ui = li("animationend"), di = li("animationiteration"), fi = li("animationstart"), pi = li("transitionrun"), mi = li("transitionstart"), hi = li("transitioncancel"), gi = li("transitionend"), _i = /* @__PURE__ */ new Map(), vi = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	vi.push("scrollEnd");
	function yi(e, t) {
		_i.set(e, t), qt(t, [e]);
	}
	var bi = 0;
	function xi(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = X.identifierPrefix;
		var n = bi++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function Si(e) {
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
	function Ci(e, t) {
		return e = Si(e), t = Si(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var wi = typeof reportError == "function" ? reportError : function(e) {
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
	}, Ti = [], Ei = 0, Di = 0;
	function Oi() {
		for (var e = Ei, t = Di = Ei = 0; t < e;) {
			var n = Ti[t];
			Ti[t++] = null;
			var r = Ti[t];
			Ti[t++] = null;
			var i = Ti[t];
			Ti[t++] = null;
			var a = Ti[t];
			if (Ti[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && Mi(n, i, a);
		}
	}
	function ki(e, t, n, r) {
		Ti[Ei++] = e, Ti[Ei++] = t, Ti[Ei++] = n, Ti[Ei++] = r, Di |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function Ai(e, t, n, r) {
		return ki(e, t, n, r), Ni(e);
	}
	function ji(e, t) {
		return ki(e, null, null, t), Ni(e);
	}
	function Mi(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - at(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function Ni(e) {
		if (50 < kd) throw kd = 0, Ad = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var Pi = {};
	function Fi(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function Ii(e, t, n, r) {
		return new Fi(e, t, n, r);
	}
	function Li(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Ri(e, t) {
		var n = e.alternate;
		return n === null ? (n = Ii(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function zi(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function Bi(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof r == "function") Li(r) && (s = 1);
		else if (typeof r == "string") s = qm(e, n, De.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case pe: return e = Ii(31, n, t, a), e.elementType = pe, e.lanes = o, e;
			case re: return Vi(n.children, a, o, t);
			case ie:
				s = 8, a |= 24;
				break;
			case ae: return e = Ii(12, n, t, a | 2), e.elementType = ae, e.lanes = o, e;
			case le: return e = Ii(13, n, t, a), e.elementType = le, e.lanes = o, e;
			case ue: return e = Ii(19, n, t, a), e.elementType = ue, e.lanes = o, e;
			case me:
			case ge: return e = a | 32, e = Ii(30, n, t, e), e.elementType = ge, e.lanes = o, e.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, e;
			default:
				if (typeof r == "object" && r) switch (r.$$typeof) {
					case se:
						s = 10;
						break a;
					case oe:
						s = 9;
						break a;
					case ce:
						s = 11;
						break a;
					case de:
						s = 14;
						break a;
					case fe:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = Ii(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function Vi(e, t, n, r) {
		return e = Ii(7, e, r, t), e.lanes = n, e;
	}
	function Hi(e, t, n) {
		return e = Ii(6, e, null, t), e.lanes = n, e;
	}
	function Ui(e) {
		var t = Ii(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function Wi(e, t, n) {
		return t = Ii(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Gi = /* @__PURE__ */ new WeakMap();
	function Ki(e, t) {
		if (typeof e == "object" && e) {
			var n = Gi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Ve(t)
			}, Gi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Ve(t)
		};
	}
	var qi = [], Ji = 0, Yi = null, Xi = 0, Zi = [], Qi = 0, $i = null, ea = 1, ta = "";
	function na(e, t) {
		qi[Ji++] = Xi, qi[Ji++] = Yi, Yi = e, Xi = t;
	}
	function ra(e, t, n) {
		Zi[Qi++] = ea, Zi[Qi++] = ta, Zi[Qi++] = $i, $i = e;
		var r = ea;
		e = ta;
		var i = 32 - at(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - at(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, ea = 1 << 32 - at(t) + i | n << i | r, ta = a + e;
		} else ea = 1 << a | n << i | r, ta = e;
	}
	function ia(e) {
		e.return !== null && (na(e, 1), ra(e, 1, 0));
	}
	function aa(e) {
		for (; e === Yi;) Yi = qi[--Ji], qi[Ji] = null, Xi = qi[--Ji], qi[Ji] = null;
		for (; e === $i;) $i = Zi[--Qi], Zi[Qi] = null, ta = Zi[--Qi], Zi[Qi] = null, ea = Zi[--Qi], Zi[Qi] = null;
	}
	function oa(e, t) {
		Zi[Qi++] = ea, Zi[Qi++] = ta, Zi[Qi++] = $i, ea = t.id, ta = t.overflow, $i = e;
	}
	var sa = null, ca = null, I = !1, la = null, ua = !1, da = Error(i(519));
	function fa(e) {
		throw va(Ki(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), da;
	}
	function pa(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[kt] = e, t[At] = r, n) {
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
				Q("invalid", t), fn(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), gn(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || ep(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = Tn), t = !0) : t = !1, t || fa(e, !0);
	}
	function ma(e) {
		for (sa = e.return; sa;) switch (sa.tag) {
			case 5:
			case 31:
			case 13:
				ua = !1;
				return;
			case 27:
			case 3:
				ua = !0;
				return;
			default: sa = sa.return;
		}
	}
	function ha(e) {
		if (e !== sa) return !1;
		if (!I) return ma(e), I = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && ca && fa(e), ma(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			ca = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			ca = dm(e);
		} else t === 27 ? (t = ca, Sp(e.type) ? (e = um, um = null, ca = e) : ca = t) : ca = sa ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function ga() {
		ca = sa = null, I = !1;
	}
	function _a() {
		var e = la;
		return e !== null && (pd === null ? pd = e : pd.push.apply(pd, e), la = null), e;
	}
	function va(e) {
		la === null ? la = [e] : la.push(e);
	}
	var ya = Ee(null), ba = null, xa = null;
	function Sa(e, t, n) {
		j(ya, t._currentValue), t._currentValue = n;
	}
	function Ca(e) {
		e._currentValue = ya.current, A(ya);
	}
	function L(e, t, n) {
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
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), L(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), L(s, n, e), s = null;
			} else a.tag === 13 && a.memoizedState !== null && a.memoizedState.dehydrated === null ? (a.lanes |= n, s = a.alternate, s !== null && (s.lanes |= n), L(a.return, n, e), s = a.child, s = s === null ? null : s.sibling) : s = a.child;
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
					Gr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === Ae.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			a = a.return;
		}
		return e !== null && wa(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function Ea(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Gr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function Da(e) {
		ba = e, xa = null, e = e.dependencies, e !== null && (e.firstContext = null);
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
		}, xa === null) {
			if (e === null) throw Error(i(308));
			xa = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else xa = xa.next = t;
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
		$$typeof: se,
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
	var qa = O.S;
	O.S = function(e, t) {
		if (gd = qe(), typeof t == "object" && t && typeof t.then == "function" && Wa(e, t), Ra !== null) for (var n = bf; n !== null;) La(n, Ra), n = n.next;
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
	var Ja = Ee(null);
	function Ya() {
		var e = Ja.current;
		return e === null ? K.pooledCache : e;
	}
	function Xa(e, t) {
		t === null ? j(Ja, Ja.current) : j(Ja, t.pool);
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
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(Tn, Tn), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, so(e), e === void 0 && !("reason" in t) ? Error(i(600)) : e;
			default:
				if (typeof t.status == "string") t.then(Tn, Tn);
				else {
					if (e = K, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
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
		throw t.$$typeof === ee ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
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
			return e = Ri(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Hi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === re ? (e = d(e, t, n.props.children, r, n.key), fo(e, n), e) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === fe && io(i) === t.type) ? (t = a(t, n.props), fo(t, n), t.return = e, t) : (t = Bi(n.type, n.key, n.props, null, e.mode, r), fo(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = Wi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = Vi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Hi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case te: return n = Bi(t.type, t.key, t.props, null, e.mode, n), fo(n, t), n.return = e, n;
					case ne: return t = Wi(t, e.mode, n), t.return = e, t;
					case fe: return t = io(t), f(e, t, n);
				}
				if (Se(t) || ye(t)) return t = Vi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, uo(t), n);
				if (t.$$typeof === se) return f(e, ka(e, t), n);
				po(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case te: return n.key === i ? l(e, t, n, r) : null;
					case ne: return n.key === i ? u(e, t, n, r) : null;
					case fe: return n = io(n), p(e, t, n, r);
				}
				if (Se(n) || ye(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, uo(n), r);
				if (n.$$typeof === se) return p(e, t, ka(e, n), r);
				po(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case te: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case ne: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case fe: return r = io(r), m(e, t, n, r, i);
				}
				if (Se(r) || ye(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, uo(r), i);
				if (r.$$typeof === se) return m(e, t, n, ka(t, r), i);
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
			if (h === s.length) return n(i, d), I && na(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return I && na(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), I && na(i, h), l;
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
			if (v.done) return n(a, h), I && na(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return I && na(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), I && na(a, g), u;
		}
		function _(e, r, o, c) {
			if (typeof o == "object" && o && o.type === re && o.key === null && o.props.ref === void 0 && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case te:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === re) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), fo(c, o), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === fe && io(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), fo(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === re ? (c = Vi(o.props.children, e.mode, c, o.key), fo(c, o), c.return = e, e = c) : (c = Bi(o.type, o.key, o.props, null, e.mode, c), fo(c, o), c.return = e, e = c);
						}
						return s(e);
					case ne:
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
							c = Wi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case fe: return o = io(o), _(e, r, o, c);
				}
				if (Se(o)) return h(e, r, o, c);
				if (ye(o)) {
					if (l = ye(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return _(e, r, uo(o), c);
				if (o.$$typeof === se) return _(e, r, ka(e, o), c);
				po(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = Hi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				lo = 0;
				var i = _(e, t, n, r);
				return co = null, i;
			} catch (t) {
				if (t === Qa || t === eo) throw t;
				var a = Ii(29, t, null, e.mode);
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
		if (r = r.shared, G & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = Ni(e), Mi(e, null, n), t;
		}
		return ki(e, r, t, n), Ni(e);
	}
	function So(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, St(e, n);
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
				if (p ? (J & f) === f : (r & f) === f) {
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
								d = D({}, d, f);
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
	var ko = Ee(null), Ao = Ee(0);
	function jo(e, t) {
		e = ad, j(Ao, e), j(ko, t), ad = e | t.baseLanes;
	}
	function Mo() {
		j(Ao, ad), j(ko, ko.current);
	}
	function No() {
		ad = Ao.current, A(ko), A(Ao);
	}
	var Po = Ee(null), Fo = null;
	function Io(e) {
		var t = e.alternate;
		j(Vo, Vo.current & 1), j(Po, e), Fo === null && (t === null || ko.current !== null || t.memoizedState !== null) && (Fo = e);
	}
	function Lo(e) {
		j(Vo, Vo.current), j(Po, e), Fo === null && (Fo = e);
	}
	function Ro(e) {
		e.tag === 22 ? (j(Vo, Vo.current), j(Po, e), Fo === null && (Fo = e)) : zo();
	}
	function zo() {
		j(Vo, Vo.current), j(Po, Po.current);
	}
	function Bo(e) {
		A(Po), Fo === e && (Fo = null), A(Vo);
	}
	var Vo = Ee(0);
	function Ho(e, t) {
		j(Po, Po.current), j(Vo, t);
	}
	function Uo(e) {
		A(Vo), A(Po), Fo === e && (Fo = null);
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
		for (var n = 0; n < t.length && n < e.length; n++) if (!Gr(e[n], t[n])) return !1;
		return !0;
	}
	function ns(e, t, n, r, i, a) {
		return Go = a, R = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, O.H = e === null || e.memoizedState === null ? yc : bc, Yo = !1, a = n(r, i), Yo = !1, Jo && (a = is(t, n, r, i)), rs(e), a;
	}
	function rs(e) {
		O.H = vc;
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
			O.H = xc, o = t(n, r);
		} while (Jo);
		return o;
	}
	function as() {
		var e = O.H, t = e.useState()[0];
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
		return Zo += 1, Qo === null && (Qo = []), e = ro(Qo, e, t), t = R, (Ko === null ? t.memoizedState : Ko.next) === null && (t = t.alternate, O.H = t === null || t.memoizedState === null ? yc : bc), e;
	}
	function ps(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return fs(e);
			if (e.$$typeof === _e) return;
			if (e.$$typeof === se) return Oa(e);
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
		}, n === null && (n = ds(), R.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = he;
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
				if (f === u.lane ? (Go & f) === f : (J & f) === f) {
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
			if (l === null ? s = o : l.next = c, !Gr(o, e.memoizedState) && (Lc = !0, d && (n = Ua, n !== null))) throw n;
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
			Gr(o, t.memoizedState) || (Lc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function ys(e, t, n) {
		var r = R, a = us(), o = I;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !Gr((z || a).memoizedState, n);
		if (s && (a.memoizedState = n, Lc = !0), a = a.queue, Ws(Ss.bind(null, r, a, e), [e]), e = a.getSnapshot !== t || s || Ko !== null && !!(Ko.memoizedState.tag & 1), zs(e ? 9 : 8, { destroy: void 0 }, xs.bind(null, r, a, n, t), null), e) {
			if (r.flags |= 2048, K === null) throw Error(i(349));
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
			return !Gr(e, n);
		} catch {
			return !0;
		}
	}
	function ws(e) {
		var t = ji(e, 2);
		t !== null && Pd(t, e, 2);
	}
	function Ts(e) {
		var t = ls();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Yo) {
				it(!0);
				try {
					n();
				} finally {
					it(!1);
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
			O.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Os(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Os(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = O.T, o = {};
			o.types = a === null ? null : a.types, O.T = o;
			try {
				var s = n(i, r), c = O.S;
				c !== null && c(o, s), ks(e, t, s);
			} catch (n) {
				js(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), O.T = a;
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
		if (I) {
			var n = K.formState;
			if (n !== null) {
				a: {
					var r = R;
					if (I) {
						if (ca) {
							b: {
								for (var i = ca, a = ua; i.nodeType !== 8;) {
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
								ca = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						fa(r);
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
			if (G & 2) throw Error(i(440));
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
			it(!0);
			try {
				e();
			} finally {
				it(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function ec(e, t, n) {
		return n === void 0 || Go & 1073741824 && !(J & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = Md(), R.lanes |= e, sd |= e, n);
	}
	function tc(e, t, n, r) {
		return Gr(n, t) ? n : ko.current === null ? !(Go & 106) || Go & 1073741824 && !(J & 261930) ? (Lc = !0, e.memoizedState = n) : (e = Md(), R.lanes |= e, sd |= e, t) : (e = ec(e, n, r), Gr(e, t) || (Lc = !0), e);
	}
	function nc(e, t, n, r, i) {
		var a = k.p;
		k.p = a !== 0 && 8 > a ? a : 8;
		var o = O.T, s = {};
		s.types = o === null ? null : o.types, O.T = s, mc(e, !1, t, n);
		try {
			var c = i(), l = O.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? pc(e, t, Ka(c, r), jd(e)) : pc(e, t, r, jd(e));
		} catch (n) {
			pc(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, jd());
		} finally {
			k.p = a, o !== null && s.types !== null && (o.types = s.types), O.T = o;
		}
	}
	function rc() {}
	function ic(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = ac(e).queue;
		nc(e, a, t, Ce, n === null ? rc : function() {
			return oc(e), n(r);
		});
	}
	function ac(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: Ce,
			baseState: Ce,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: hs,
				lastRenderedState: Ce
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
		}, hc(e) ? gc(t, n) : (n = Ai(e, t, n, r), n !== null && (Pd(n, e, r), _c(n, t, r)));
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
				if (i.hasEagerState = !0, i.eagerState = s, Gr(s, o)) return ki(e, t, i, 0), K === null && Oi(), !1;
			} catch {}
			if (n = Ai(e, t, i, r), n !== null) return Pd(n, e, r), _c(n, t, r), !0;
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
		} else t = Ai(e, n, r, 2), t !== null && Pd(t, e, 2);
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
			r &= e.pendingLanes, n |= r, t.lanes = n, St(e, n);
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
				it(!0);
				try {
					e();
				} finally {
					it(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = ls();
			if (n !== void 0) {
				var i = n(t);
				if (Yo) {
					it(!0);
					try {
						n(t);
					} finally {
						it(!1);
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
			if (I) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), K === null) throw Error(i(349));
				J & 127 || bs(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, Us(Ss.bind(null, r, o, e), [e]), r.flags |= 2048, zs(9, { destroy: void 0 }, xs.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = ls(), t = K.identifierPrefix;
			if (I) {
				var n = ta, r = ea;
				n = (r & ~(1 << 32 - at(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = Xo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
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
				if (G & 2) throw Error(i(440));
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
		t = e.memoizedState, n = n(r, t), n = n == null ? t : D({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
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
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Kr(n, r) || !Kr(i, a) : !0;
	}
	function Tc(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Cc.enqueueReplaceState(t, t.state, null);
	}
	function Ec(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = D({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Dc(e) {
		wi(e);
	}
	function Oc(e) {
		console.error(e);
	}
	function kc(e) {
		wi(e);
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
			jc(t, n, r), typeof i != "function" && (yd === null ? yd = /* @__PURE__ */ new Set([this]) : yd.add(this));
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
					case 19: return Fo === null ? Kd() : n.alternate === null && od === 0 && (od = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === to ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), mf(e, r, a)), !1;
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
		if (I) return t = Po.current, t === null ? (r !== da && (t = Error(i(423), { cause: r }), va(Ki(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = Ki(r, n), a = Mc(e.stateNode, r, a), Co(e, a), od !== 4 && (od = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== da && (e = Error(i(422), { cause: r }), va(Ki(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = Ki(o, n), fd === null ? fd = [o] : fd.push(o), od !== 4 && (od = 2), t === null) return !0;
		r = Ki(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Mc(n.stateNode, r, e), Co(n, e), !1;
				case 1:
					if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (yd === null || !yd.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = Nc(a), Pc(a, e, n, r), Co(n, a), !1;
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
		return Da(t), r = ns(e, t, n, o, a, i), s = os(), e !== null && !Lc ? (ss(e, t, i), pl(e, t, i)) : (I && s && ia(t), t.flags |= 1, Rc(e, t, r, i), t.child);
	}
	function Bc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !Li(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, Vc(e, t, a, r, i)) : (e = Bi(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !ml(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Kr : n, n(o, r) && e.ref === t.ref) return pl(e, t, i);
		}
		return t.flags |= 1, e = Ri(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Vc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Kr(a, r) && e.ref === t.ref) {
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
			if (I) {
				if (r.mode === "hidden") return e = Gc(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, Uc(null, e);
				if (Lo(t), (e = ca) ? (e = am(e, ua), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: $i === null ? null : {
						id: ea,
						overflow: ta
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ui(e), n.return = t, t.child = n, sa = t, ca = null)) : e = null, e === null) throw fa(t);
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
					if (r = K, r !== null && (s = Ct(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, ji(e, s), Pd(r, e, s), Ic;
					Kd();
				}
				t = Kc(e, t, n);
			} else e = o.treeContext, ca = lm(s.nextSibling), sa = t, I = !0, la = null, ua = !1, e !== null && oa(t, e), t = Gc(t, r), t.flags |= 134221824;
			return t;
		}
		return e = Ri(e.child, {
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
		return Da(t), n = ns(e, t, n, r, void 0, i), r = os(), e !== null && !Lc ? (ss(e, t, i), pl(e, t, i)) : (I && r && ia(t), t.flags |= 1, Rc(e, t, n, i), t.child);
	}
	function Xc(e, t, n, r, i, a) {
		return Da(t), t.updateQueue = null, n = is(t, r, n, i), rs(e), r = os(), e !== null && !Lc ? (ss(e, t, a), pl(e, t, a)) : (I && r && ia(t), t.flags |= 1, Rc(e, t, n, a), t.child);
	}
	function Zc(e, t, n, r, i) {
		if (Da(t), t.stateNode === null) {
			var a = Pi, o = n.contextType;
			typeof o == "object" && o && (a = Oa(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Cc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, vo(t), o = n.contextType, a.context = typeof o == "object" && o ? Oa(o) : Pi, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Sc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Cc.enqueueReplaceState(a, a.state, null), Eo(t, r, a, i), To(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Ec(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = Pi, typeof u == "object" && u && (o = Oa(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Tc(t, a, r, o), _o = !1;
			var f = t.memoizedState;
			a.state = f, Eo(t, r, a, i), To(), l = t.memoizedState, s || f !== l || _o ? (typeof d == "function" && (Sc(t, n, d, r), l = t.memoizedState), (c = _o || wc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, yo(e, t), o = t.memoizedProps, u = Ec(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = Pi, typeof l == "object" && l && (c = Oa(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Tc(t, a, r, c), _o = !1, f = t.memoizedState, a.state = f, Eo(t, r, a, i), To();
			var p = t.memoizedState;
			o !== d || f !== p || _o || e !== null && e.dependencies !== null && Ea(e.dependencies) ? (typeof s == "function" && (Sc(t, n, s, r), p = t.memoizedState), (u = _o || wc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Ea(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, Jc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = ho(t, e.child, null, i), t.child = ho(t, null, n, i)) : Rc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = pl(e, t, i), e;
	}
	function Qc(e, t, n, r) {
		return ga(), t.flags |= 256, Rc(e, t, n, r), t.child;
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
			if (I) {
				if (i ? Io(t) : zo(), (e = ca) ? (e = am(e, ua), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: $i === null ? null : {
						id: ea,
						overflow: ta
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ui(e), n.return = t, t.child = n, sa = t, ca = null)) : e = null, e === null) throw fa(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (zo(), i = t.mode, a = il({
				mode: "hidden",
				children: a
			}, i), r = Vi(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = el(n), r.childLanes = tl(e, o, n), t.memoizedState = $c, Uc(null, r)) : (Io(t), rl(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return ol(e, t, a, o, r, c, s, n);
		}
		return i ? (zo(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = Ri(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = Vi(i, a, n, null), i.flags |= 2) : i = Ri(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, Uc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = el(n) : (a = i.cachePool, a === null ? a = Za() : (s = Pa._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = tl(e, o, n), t.memoizedState = $c, Uc(e.child, r)) : (Io(t), n = e.child, e = n.sibling, n = Ri(n, {
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
		return e = Ii(22, e, null, t), e.lanes = 0, e;
	}
	function al(e, t, n) {
		return ho(t, e.child, null, n), e = rl(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function ol(e, t, n, r, a, o, s, c) {
		if (n) return t.flags & 256 ? (Io(t), t.flags &= -257, al(e, t, c)) : t.memoizedState === null ? (zo(), o = a.fallback, s = t.mode, a = il({
			mode: "visible",
			children: a.children
		}, s), o = Vi(o, s, c, null), o.flags |= 2, a.return = t, o.return = t, a.sibling = o, t.child = a, ho(t, e.child, null, c), a = t.child, a.memoizedState = el(c), a.childLanes = tl(e, r, c), t.memoizedState = $c, Uc(null, a)) : (zo(), t.child = e.child, t.flags |= 128, null);
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
			if (r = K, r !== null && (a = Ct(r, c), a !== 0 && a !== s.retryLane)) throw s.retryLane = a, ji(e, a), Pd(r, e, a), Ic;
			return om(o) || Kd(), al(e, t, c);
		}
		return om(o) ? (t.flags |= 192, t.child = e.child, null) : (e = s.treeContext, ca = lm(o.nextSibling), sa = t, I = !0, la = null, ua = !1, e !== null && oa(t, e), t = rl(t, a.children), t.flags |= 134221824, t);
	}
	function sl(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), L(e.return, t, n);
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
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Ho(t, o), i === "backwards" && e !== null ? (ul(e), Rc(e, t, r, n), ul(e)) : Rc(e, t, r, n), r = I ? Xi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
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
		return Sa(t, t.type, r.value), Rc(e, t, r.children, n), t.child;
	}
	function pl(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), sd |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (Ta(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = Ri(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Ri(e, e.pendingProps), n.return = t;
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
				je(t, t.stateNode.containerInfo), Sa(t, Pa, e.memoizedState.cache), ga();
				break;
			case 27:
			case 5:
				Ne(t);
				break;
			case 4:
				je(t, t.stateNode.containerInfo);
				break;
			case 10:
				Sa(t, t.type, t.memoizedProps.value);
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
			case 24: Sa(t, Pa, e.memoizedState.cache);
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
		} else Lc = !1, I && t.flags & 1048576 && ra(t, Xi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = io(t.elementType), t.type = e, typeof e == "function") Li(e) ? (r = Ec(e, r), t.tag = 1, t = Zc(null, t, e, r, n)) : (t.tag = 0, t = Yc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === ce) {
								t.tag = 11, t = zc(null, t, e, r, n);
								break a;
							}
							if (a === de) {
								t.tag = 14, t = Bc(null, t, e, r, n);
								break a;
							}
							if (a === se) {
								t.tag = 10, t.type = e, t = fl(null, t, n);
								break a;
							}
						}
						throw t = xe(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return Yc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Ec(r, t.pendingProps), Zc(e, t, r, a, n);
			case 3:
				a: {
					if (je(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, yo(e, t), Eo(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Sa(t, Pa, r), r !== o.cache && wa(t, [Pa], n, !0), To(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = Qc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = Ki(Error(i(424)), t), va(a), t = Qc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (ca = lm(e.firstChild), sa = t, I = !0, la = null, ua = !0, n = go(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (ga(), r === a) {
							t = pl(e, t, n);
							break a;
						}
						Rc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return Jc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : I || (t.stateNode = fp(t.type, t.pendingProps, ke.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return Ne(t), e === null && I && (r = t.stateNode = hm(t.type, t.pendingProps, ke.current), sa = t, ua = !0, a = ca, Sp(t.type) ? (um = a, ca = lm(r.firstChild)) : ca = a), Rc(e, t, t.pendingProps.children, n), Jc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && I && ((a = r = ca) && (r = rm(r, t.type, t.pendingProps, ua), r === null ? a = !1 : (t.stateNode = r, sa = t, ca = lm(r.firstChild), ua = !1, a = !0)), a || fa(t)), Ne(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, pp(a, o) ? r = null : s !== null && pp(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = ns(e, t, as, null, null, n), sh._currentValue = a), Jc(e, t), Rc(e, t, r, n), t.child;
			case 6: return e === null && I && ((e = n = ca) && (n = im(n, t.pendingProps, ua), n === null ? e = !1 : (t.stateNode = n, sa = t, ca = null, e = !0)), e || fa(t)), null;
			case 13: return nl(e, t, n);
			case 4: return je(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = ho(t, null, r, n) : Rc(e, t, r, n), t.child;
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
			case 24: return Da(t), r = Oa(Pa), e === null ? (a = Ya(), a === null && (a = K, o = Fa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, vo(t), Sa(t, Pa, a)) : ((e.lanes & n) !== 0 && (yo(e, t), Eo(t, null, null, n), To()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Sa(t, Pa, r), r !== a.cache && wa(t, [Pa], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Sa(t, Pa, r))), Rc(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : I && ia(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : Jc(e, t), Rc(e, t, r.children, n), t.child;
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
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : _t(), e.lanes |= t, dd |= t);
	}
	function xl(e, t) {
		if (!I) switch (e.tailMode) {
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
	function Sl(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 1206910976, r |= i.flags & 1206910976, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Cl(e, t, n) {
		var r = t.pendingProps;
		switch (aa(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return Sl(t), null;
			case 1: return Sl(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Ca(Pa), Me(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (ha(t) ? _l(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, _a())), Sl(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (_l(t), o === null ? (Sl(t), vl(t, a, null, r, n)) : (Sl(t), yl(t, o))) : o ? o === e.memoizedState ? (Sl(t), t.flags &= -16777217) : (_l(t), Sl(t), yl(t, o)) : (e = e.memoizedProps, e !== r && _l(t), Sl(t), vl(t, a, e, r, n)), null;
			case 27:
				if (Pe(t), n = ke.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Sl(t), t.subtreeFlags &= -33554433, null;
					}
					e = De.current, ha(t) ? pa(t, e) : (e = hm(a, r, n), t.stateNode = e, _l(t));
				}
				return Sl(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (Pe(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Sl(t), t.subtreeFlags &= -33554433, null;
					}
					if (o = De.current, ha(t)) pa(t, o);
					else {
						var s = lp(ke.current);
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
						o[kt] = t, o[At] = r;
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
				return Sl(t), t.subtreeFlags &= -33554433, vl(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && _l(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = ke.current, ha(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = sa, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[kt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || ep(e.nodeValue, n)), e || fa(t, !0);
					} else e = lp(e).createTextNode(r), e[kt] = t, t.stateNode = e;
				}
				return Sl(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = ha(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[kt] = t;
						} else ga(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Sl(t), e = !1;
					} else n = _a(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (Bo(t), t) : (Bo(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return Sl(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = ha(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[kt] = t;
						} else ga(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Sl(t), a = !1;
					} else a = _a(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (Bo(t), t) : (Bo(t), null);
				}
				return Bo(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), bl(t, t.updateQueue), Sl(t), null);
			case 4: return Me(), e === null && Wf(t.stateNode.containerInfo), t.flags |= 67108864, Sl(t), null;
			case 10: return Ca(t.type), Sl(t), null;
			case 19:
				if (Uo(t), r = t.memoizedState, r === null) return Sl(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) xl(r, !1);
					else {
						if (od !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = Wo(e), o !== null) {
								for (t.flags |= 128, xl(r, !1), e = o.updateQueue, t.updateQueue = e, bl(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) zi(n, e), n = n.sibling;
								return Ho(t, Vo.current & 1 | 2), I && na(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && qe() > _d && (t.flags |= 128, a = !0, xl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = Wo(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, bl(t, e), xl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !o.alternate && !I) return Sl(t), null;
						} else 2 * qe() - r.renderingStartTime > _d && n !== 536870912 && (t.flags |= 128, a = !0, xl(r, !1), t.lanes = 4194304);
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
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = qe(), e.sibling = null, o = Vo.current, o = a ? o & 1 | 2 : o & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || I ? Ho(t, o) : (n = o, j(Po, t), j(Vo, n), Fo === null && (Fo = t)), I && na(t, r.treeForkCount), e;
				}
				return Sl(t), null;
			case 22:
			case 23: return Bo(t), No(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (Sl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Sl(t), n = t.updateQueue, n !== null && bl(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && A(Ja), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Ca(Pa), Sl(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, Sl(t), null;
		}
		throw Error(i(156, t.tag));
	}
	function wl(e, t) {
		switch (aa(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Ca(Pa), Me(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return Pe(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (Bo(t), t.alternate === null) throw Error(i(340));
					ga();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (Bo(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					ga();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return Uo(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return Me(), null;
			case 10: return Ca(t.type), null;
			case 22:
			case 23: return Bo(t), No(), e !== null && A(Ja), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Ca(Pa), null;
			case 25: return null;
			default: return null;
		}
	}
	function Tl(e, t) {
		switch (aa(t), t.tag) {
			case 3:
				Ca(Pa), Me();
				break;
			case 26:
			case 27:
			case 5:
				Pe(t);
				break;
			case 4:
				Me();
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
				Ca(t.type);
				break;
			case 22:
			case 23:
				Bo(t), No(), e !== null && A(Ja);
				break;
			case 24: Ca(Pa);
		}
	}
	function El(e, t) {
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
	function Dl(e, t, n) {
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
	function Ol(e) {
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
	function kl(e, t, n) {
		n.props = Ec(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Al(e, t) {
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
						var i = e.stateNode, a = xi(e.memoizedProps, i);
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
	function jl(e, t) {
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
	function Ml(e, t) {
		if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null) for (var n = 0; n < t.length; n++) em(e.stateNode, t[n]);
	}
	function Nl(e) {
		for (var t = e.return; t !== null && (Il(t) && em(e.stateNode, t.stateNode), !Fl(t));) t = t.return;
	}
	function Pl(e) {
		for (var t = e.return; t !== null && (Il(t) && tm(e.stateNode, t.stateNode), !Fl(t));) t = t.return;
	}
	function Fl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 27;
	}
	function Il(e) {
		return e && e.tag === 7 && e.stateNode !== null;
	}
	function Ll(e) {
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
	function Rl(e, t, n) {
		try {
			var r = e.stateNode;
			ip(r, e.type, n, t), r[At] = t;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function B(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Sp(e.type) || e.tag === 4;
	}
	function zl(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || B(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Sp(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Bl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Tn)), Ml(e, r), M = !0;
		else if (i !== 4 && (i === 27 && (Ml(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (Bl(e, t, n, r), e = e.sibling; e !== null;) Bl(e, t, n, r), e = e.sibling;
	}
	function Vl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), Ml(e, r), M = !0;
		else if (i !== 4 && (i === 27 && (Ml(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (Vl(e, t, n, r), e = e.sibling; e !== null;) Vl(e, t, n, r), e = e.sibling;
	}
	function Hl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			np(t, r, n), t[kt] = e, t[At] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var Ul = !1, Wl = null;
	function Gl(e) {
		(e.tag === 30 || e.subtreeFlags & 33554432) && (Ul = !0);
	}
	var Kl = null;
	function ql() {
		var e = Kl;
		return Kl = null, e;
	}
	var Jl = 0;
	function Yl(e, t, n, r, i) {
		return Jl = 0, Xl(e.child, t, n, r, i);
	}
	function Xl(e, t, n, r, i) {
		for (var a = !1; e !== null;) {
			if (e.tag === 5) {
				var o = e.stateNode;
				if (r !== null) {
					var s = Op(o);
					r.push(s), s.view && (a = !0);
				} else a || Op(o).view && (a = !0);
				Ul = !0, Tp(o, Jl === 0 ? t : t + "_" + Jl, n), Jl++;
			} else (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && i || Xl(e.child, t, n, r, i) && (a = !0));
			e = e.sibling;
		}
		return a;
	}
	function Zl(e, t) {
		for (; e !== null;) e.tag === 5 ? Ep(e.stateNode, e.memoizedProps) : (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && t || Zl(e.child, t)), e = e.sibling;
	}
	function Ql(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if ((e.tag !== 22 || e.memoizedState === null) && (Ql(e), e.tag === 30 && e.flags & 18874368 && e.stateNode.paired)) {
				var t = e.memoizedProps;
				if (t.name == null || t.name === "auto") throw Error(i(544));
				var n = t.name;
				t = Ci(t.default, t.share), t !== "none" && (Yl(e, n, t, null, !1) || Zl(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function $l(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = xi(r, n), a = Ci(r.default, n.paired ? r.share : r.enter);
			a === "none" ? Ql(e) : Yl(e, i, a, null, !1) ? (Ql(e), n.paired || t || Nd(e, r.onEnter)) : Zl(e.child, !1);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) $l(e, t), e = e.sibling;
		else Ql(e);
	}
	function eu(e) {
		if (Wl !== null && Wl.size !== 0) {
			var t = Wl;
			if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
				if (e.tag !== 22 || e.memoizedState === null) {
					if (e.tag === 30 && e.flags & 18874368) {
						var n = e.memoizedProps, r = n.name;
						if (r != null && r !== "auto") {
							var i = t.get(r);
							if (i !== void 0) {
								var a = Ci(n.default, n.share);
								if (a !== "none" && (Yl(e, r, a, null, !1) ? (a = e.stateNode, i.paired = a, a.paired = i, Nd(e, n.onShare)) : Zl(e.child, !1)), t.delete(r), t.size === 0) break;
							}
						}
					}
					eu(e);
				}
				e = e.sibling;
			}
		}
	}
	function tu(e) {
		if (e.tag === 30) {
			var t = e.memoizedProps, n = xi(t, e.stateNode), r = Wl === null ? void 0 : Wl.get(n), i = Ci(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (Yl(e, n, i, null, !1) ? r === void 0 ? Nd(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, Wl.delete(n), Nd(e, t.onShare)) : Zl(e.child, !1)), Wl !== null && eu(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) tu(e), e = e.sibling;
		else Wl !== null && eu(e);
	}
	function nu(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = xi(t, e.stateNode);
				t = Ci(t.default, t.update), e.flags &= -5, t !== "none" && Yl(e, n, t, e.memoizedState = [], !1);
			} else e.subtreeFlags & 33554432 && nu(e);
			e = e.sibling;
		}
	}
	function ru(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if (e.tag !== 22 || e.memoizedState === null) {
				if (e.tag === 30 && e.flags & 18874368) {
					var t = e.stateNode;
					t.paired !== null && (t.paired = null, Zl(e.child, !1));
				}
				ru(e);
			}
			e = e.sibling;
		}
	}
	function iu(e) {
		if (e.tag === 30) e.stateNode.paired = null, Zl(e.child, !1), ru(e);
		else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) iu(e), e = e.sibling;
		else ru(e);
	}
	function au(e) {
		for (e = e.child; e !== null;) e.tag === 30 ? Zl(e.child, !1) : e.subtreeFlags & 33554432 && au(e), e = e.sibling;
	}
	function ou(e, t, n, r, i, a, o) {
		for (var s = !1; t !== null;) {
			if (t.tag === 5) {
				var c = t.stateNode;
				if (a !== null && Jl < a.length) {
					var l = a[Jl], u = Op(c);
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
				e.flags & 4 && Tp(c, Jl === 0 ? n : n + "_" + Jl, i), s && e.flags & 4 || (Kl === null && (Kl = []), Kl.push(c, Jl === 0 ? r : r + "_" + Jl, t.memoizedProps)), Jl++;
			} else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && o ? e.flags |= t.flags & 32 : ou(e, t.child, n, r, i, a, o) && (s = !0));
			t = t.sibling;
		}
		return s;
	}
	function su(e, t) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var n = e.memoizedProps, r = e.stateNode, i = xi(n, r), a = Ci(n.default, n.update);
				if (t) {
					r = r.clones;
					var o = r === null ? null : r.map(kp);
				} else o = e.memoizedState, e.memoizedState = null;
				r = e;
				var s = e.child;
				Jl = 0, i = ou(r, s, i, i, a, o, !1), e.flags & 4 && i && (t || Nd(e, n.onUpdate));
			} else e.subtreeFlags & 33554432 && su(e, t);
			e = e.sibling;
		}
	}
	var cu = !1, V = !1, lu = !1, H = !1, uu = typeof WeakSet == "function" ? WeakSet : Set, du = null, fu = !1, pu = !1, mu = !1, hu = !1;
	function gu(e, t, n) {
		if (e = e.containerInfo, sp = gh, e = Zr(e), Qr(e)) {
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
		}, gh = !1, n = (n & 335544064) === n, du = t, t = n ? 9270 : 1024; du !== null;) {
			if (e = du, n && (r = e.deletions, r !== null)) for (a = 0; a < r.length; a++) n && tu(r[a]);
			if (e.alternate === null && e.flags & 2) n && Gl(e), _u(n);
			else {
				if (e.tag === 22) {
					if (r = e.alternate, e.memoizedState !== null) {
						r !== null && r.memoizedState === null && n && tu(r), _u(n);
						continue;
					}
					if (r !== null && r.memoizedState !== null) {
						n && Gl(e), _u(n);
						continue;
					}
				}
				r = e.child, (e.subtreeFlags & t) !== 0 && r !== null ? (r.return = e, du = r) : (n && nu(e), _u(n));
			}
		}
		Wl = null;
	}
	function _u(e) {
		for (; du !== null;) {
			var t = du, n = e, r = t.alternate, a = t.flags;
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
					n && r !== null && (n = xi(r.memoizedProps, r.stateNode), a = t.memoizedProps, a = Ci(a.default, a.update), a !== "none" && Yl(r, n, a, r.memoizedState = [], !0));
					break;
				default: if (a & 1024) throw Error(i(163));
			}
			if (r = t.sibling, r !== null) {
				r.return = t.return, du = r;
				break;
			}
			du = t.return;
		}
	}
	function vu(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				Iu(e, n), r & 4 && El(5, n);
				break;
			case 1:
				if (Iu(e, n), r & 4) {
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
				r & 64 && Ol(n), r & 512 && Al(n, n.return);
				break;
			case 3:
				if (Iu(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
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
			case 27: t === null && r & 4 && Hl(n);
			case 26:
			case 5:
				Iu(e, n), t === null && r & 4 && Ll(n), r & 512 && Al(n, n.return);
				break;
			case 12:
				Iu(e, n);
				break;
			case 31:
				Iu(e, n), r & 4 && Eu(e, n);
				break;
			case 13:
				Iu(e, n), r & 4 && Du(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = _f.bind(null, n), cm(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || cu, !r) {
					var a = t !== null && t.memoizedState !== null || V;
					t = cu, i = V, cu = r, (V = a) && !i ? (r = 2, n.subtreeFlags & 8772 && (r |= 1), Ru(e, n, r)) : Iu(e, n), cu = t, V = i;
				}
				break;
			case 30:
				Iu(e, n), r & 512 && Al(n, n.return);
				break;
			case 7: r & 512 && Al(n, n.return);
			default: Iu(e, n);
		}
	}
	function yu(e, t) {
		for (e = e.child; e !== null;) bu(e, t), e = e.sibling;
	}
	function bu(e, t) {
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
				U(e, t);
				break;
			case 6:
				try {
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, M = !0;
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
				e.memoizedState === null && yu(e, t);
				break;
			default: yu(e, t);
		}
	}
	function U(e, t) {
		if (e.subtreeFlags & 67108864) for (e = e.child; e !== null;) {
			a: {
				var n = e, r = t;
				switch (n.tag) {
					case 4:
						bu(n, r);
						break a;
					case 22:
						n.memoizedState === null && U(n, r);
						break a;
					default: U(n, r);
				}
			}
			e = e.sibling;
		}
	}
	function xu(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, xu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Rt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var Su = null, Cu = !1;
	function wu(e, t, n) {
		for (n = n.child; n !== null;) Tu(e, t, n), n = n.sibling;
	}
	function Tu(e, t, n) {
		if (rt && typeof rt.onCommitFiberUnmount == "function") try {
			rt.onCommitFiberUnmount(nt, n);
		} catch {}
		switch (n.tag) {
			case 26:
				V || jl(n, t), wu(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !V && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				V || jl(n, t), Pl(n);
				var r = Su, i = Cu;
				Sp(n.type) && (Su = n.stateNode, Cu = !1), wu(e, t, n), gm(n.stateNode, n.type, n.memoizedProps), Su = r, Cu = i;
				break;
			case 5: V || jl(n, t), Pl(n);
			case 6:
				if (n.tag === 6 && Pl(n), r = Su, i = Cu, Su = null, wu(e, t, n), Su = r, Cu = i, Su !== null) {
					if (Cu) try {
						(Su.nodeType === 9 ? Su.body : Su.nodeName === "HTML" ? Su.ownerDocument.body : Su).removeChild(n.stateNode), M = !0;
					} catch (e) {
						Z(n, t, e);
					}
					else try {
						Su.removeChild(n.stateNode), M = !0;
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
				Dl(2, n, t), V || Dl(4, n, t), wu(e, t, n);
				break;
			case 1:
				V || (jl(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && kl(n, t, r)), wu(e, t, n);
				break;
			case 21:
				wu(e, t, n);
				break;
			case 22:
				V = (r = V) || n.memoizedState !== null, wu(e, t, n), V = r;
				break;
			case 30:
				jl(n, t), wu(e, t, n);
				break;
			case 7:
				V || jl(n, t), wu(e, t, n);
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
				return t === null && (t = e.stateNode = new uu()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new uu()), t;
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
	function W(e, t, n) {
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
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) ju(t, e, n), t = t.sibling;
	}
	var Au = null;
	function ju(e, t, n) {
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
				W(t, e, n), Mu(e), a & 4 && (Dl(3, e, e.return), El(3, e), Dl(5, e, e.return));
				break;
			case 1:
				W(t, e, n), Mu(e), a & 512 && (V || r === null || jl(r, r.return)), a & 64 && cu && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? t : n.concat(t))));
				break;
			case 26:
				if (o = Au, W(t, e, n), Mu(e), a & 512 && (V || r === null || jl(r, r.return)), a & 4) {
					if (a = r === null ? null : r.memoizedState, n = e.memoizedState, r === null) {
						if (n === null) {
							if (e.stateNode === null) {
								if (cu) e.stateNode = fp(e.type, e.memoizedProps, t.containerInfo, e);
								else {
									a: {
										t = e.type, n = e.memoizedProps, a = o.ownerDocument || o;
										b: switch (t) {
											case "title":
												r = a.getElementsByTagName("title")[0], (!r || r[It] || r[kt] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = a.createElement(t), a.head.insertBefore(r, a.querySelector("head > title"))), np(r, t, n), r[kt] = e, Ut(r), t = r;
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
										r[kt] = e, Ut(r), t = r;
									}
									e.stateNode = t;
								}
							} else cu || Km(o, e.type, e.stateNode);
						} else e.stateNode = Bm(o, n, e.memoizedProps);
					} else a === n ? n === null && e.stateNode !== null && Rl(e, e.memoizedProps, r.memoizedProps) : (a === null ? (t = r.stateNode, t === null || V || t.parentNode.removeChild(t)) : a.count--, n === null ? cu || Km(o, e.type, e.stateNode) : Bm(o, n, e.memoizedProps));
				}
				break;
			case 27:
				W(t, e, n), Mu(e), a & 512 && (V || r === null || jl(r, r.return)), r !== null && a & 4 && Rl(e, e.memoizedProps, r.memoizedProps);
				break;
			case 5:
				if (o = lu, lu = !1, W(t, e, n), lu = o, Mu(e), a & 512 && (V || r === null || jl(r, r.return)), e.flags & 32) {
					t = e.stateNode;
					try {
						_n(t, ""), M = !0;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				a & 4 && e.stateNode != null && (t = e.memoizedProps, Rl(e, t, r === null ? t : r.memoizedProps)), a & 1024 && (H = !0);
				break;
			case 6:
				if (W(t, e, n), Mu(e), a & 4) {
					if (e.stateNode === null) throw Error(i(162));
					t = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = t, M = !0;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				break;
			case 3:
				if (M = !1, Wm = null, o = Au, Au = bm(t.containerInfo), W(t, e, n), Au = o, Mu(e), a & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					Z(e, e.return, t);
				}
				H && (H = !1, Nu(e)), M = !1;
				break;
			case 4:
				a = lu, lu = cu, r = $t(), o = Au, Au = bm(e.stateNode.containerInfo), W(t, e, n), Mu(e), Au = o, M && pu && (mu = !0), M = r, lu = a;
				break;
			case 12:
				W(t, e, n), Mu(e);
				break;
			case 31:
				W(t, e, n), Mu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ku(e, t)));
				break;
			case 13:
				W(t, e, n), Mu(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (hd = qe()), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ku(e, t)));
				break;
			case 22:
				o = e.memoizedState !== null, s = r !== null && r.memoizedState !== null;
				var c = cu, l = V, u = lu;
				cu = c || o, lu = u || o, V = l || s, W(t, e, n), V = l, lu = u, cu = c, Mu(e), a & 8192 && (t = e.stateNode, t._visibility = o ? t._visibility & -2 : t._visibility | 1, !o || r === null || s || cu || V || (t = s || V, n = cu, r = V, cu = o || cu, V = t, Lu(e, 2), cu = n, V = r), !o && lu || yu(e, o)), a & 4 && (t = e.updateQueue, t !== null && (n = t.retryQueue, n !== null && (t.retryQueue = null, ku(e, n))));
				break;
			case 19:
				W(t, e, n), Mu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, ku(e, t)));
				break;
			case 30:
				a & 512 && (V || r === null || jl(r, r.return)), a = $t(), o = pu, s = (n & 335544064) === n, c = e.memoizedProps, pu = s && Ci(c.default, c.update) !== "none", W(t, e, n), Mu(e), s && r !== null && M && (e.flags |= 4), pu = o, M = a;
				break;
			case 21: break;
			case 7: a & 512 && (V || r === null || jl(r, r.return)), r && r.stateNode !== null && (r.stateNode._fragmentFiber = e);
			default: W(t, e, n), Mu(e);
		}
	}
	function Mu(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (B(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				r = null;
				for (var a = e.return; a !== null;) {
					if (Il(a)) {
						var o = a.stateNode;
						r === null ? r = [o] : r.push(o);
					}
					if (Fl(a)) break;
					a = a.return;
				}
				var s = r;
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var c = n.stateNode;
						Vl(e, zl(e), c, s);
						break;
					case 5:
						var l = n.stateNode;
						n.flags & 32 && (_n(l, ""), n.flags &= -33), Vl(e, zl(e), l, s);
						break;
					case 3:
					case 4:
						var u = n.stateNode.containerInfo;
						Bl(e, zl(e), u, s);
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
	function Nu(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			Nu(t), t.tag === 5 && t.flags & 1024 && (t = t.stateNode, gh = !0, t.reset(), gh = !1), e = e.sibling;
		}
	}
	function Pu(e, t) {
		if (t.subtreeFlags & 9270) for (t = t.child; t !== null;) Fu(t, e), t = t.sibling;
		else su(t, !1);
	}
	function Fu(e, t) {
		var n = e.alternate;
		if (n === null) $l(e, !1);
		else switch (e.tag) {
			case 3:
				if (hu = fu = !1, ql(), Pu(t, e), !fu && !mu) {
					if (e = Kl, e !== null) for (var r = 0; r < e.length; r += 3) {
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
					})), hu = !0;
				}
				Kl = null;
				break;
			case 5:
				Pu(t, e);
				break;
			case 4:
				r = fu, fu = !1, Pu(t, e), fu && (mu = !0), fu = r;
				break;
			case 22:
				e.memoizedState === null && (n.memoizedState === null ? Pu(t, e) : $l(e, !1));
				break;
			case 30:
				r = fu, i = ql(), fu = !1, Pu(t, e), fu && (e.flags |= 4);
				var a = e.memoizedProps, o = e.stateNode;
				t = xi(a, o), o = xi(n.memoizedProps, o);
				var s = Ci(a.default, a.update);
				s === "none" ? t = !1 : (a = n.memoizedState, n.memoizedState = null, n = e.child, Jl = 0, t = ou(e, n, t, o, s, a, !0), Jl !== (a === null ? 0 : a.length) && (e.flags |= 32)), e.flags & 4 && t ? (Nd(e, e.memoizedProps.onUpdate), Kl = i) : i !== null && (i.push.apply(i, Kl), Kl = i), fu = e.flags & 32 ? !0 : r;
				break;
			default: Pu(t, e);
		}
	}
	function Iu(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) vu(e, t.alternate, t), t = t.sibling;
	}
	function Lu(e, t) {
		for (e = e.child; e !== null;) {
			var n = e, r = t;
			switch (n.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Dl(4, n, n.return), Lu(n, r);
					break;
				case 1:
					jl(n, n.return);
					var i = n.stateNode;
					typeof i.componentWillUnmount == "function" && kl(n, n.return, i), Lu(n, r);
					break;
				case 27: r & 2 && gm(n.stateNode, n.type, n.memoizedProps);
				case 5:
					jl(n, n.return), n.tag !== 5 && n.tag !== 27 || Pl(n), Lu(n, r);
					break;
				case 6:
					Pl(n);
					break;
				case 26:
					jl(n, n.return), i = n.stateNode, n.memoizedState !== null || i === null || V || i.parentNode.removeChild(i), Lu(n, r);
					break;
				case 22:
					n.memoizedState === null && Lu(n, r);
					break;
				case 30:
					jl(n, n.return), Lu(n, r);
					break;
				case 7: jl(n, n.return);
				default: Lu(n, r);
			}
			e = e.sibling;
		}
	}
	function Ru(e, t, n) {
		for (n = t.subtreeFlags & 8772 ? n : n & -2, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags, s = !!(n & 1);
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Ru(i, a, n), El(4, a);
					break;
				case 1:
					if (Ru(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
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
					s && o & 64 && Ol(a), Al(a, a.return);
					break;
				case 27: n & 2 && Hl(a);
				case 5:
					a.tag !== 5 && a.tag !== 27 || Nl(a), Ru(i, a, n), s && r === null && o & 4 && Ll(a), Al(a, a.return);
					break;
				case 6:
					Nl(a);
					break;
				case 26:
					c = a.stateNode, a.memoizedState !== null || c === null || cu || Km(bm(c.ownerDocument), a.type, c), Ru(i, a, n), s && r === null && o & 4 && Ll(a), Al(a, a.return);
					break;
				case 12:
					Ru(i, a, n);
					break;
				case 31:
					Ru(i, a, n), s && o & 4 && Eu(i, a);
					break;
				case 13:
					Ru(i, a, n), s && o & 4 && Du(i, a);
					break;
				case 22:
					a.memoizedState === null && Ru(i, a, n), Al(a, a.return);
					break;
				case 30:
					Ru(i, a, n), Al(a, a.return);
					break;
				case 7: Al(a, a.return);
				default: Ru(i, a, n);
			}
			t = t.sibling;
		}
	}
	function zu(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && Ia(n));
	}
	function Bu(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ia(e));
	}
	function Vu(e, t, n, r) {
		var i = (n & 335544064) === n;
		if (t.subtreeFlags & (i ? 10262 : 10256)) for (t = t.child; t !== null;) Hu(e, t, n, r), t = t.sibling;
		else i && au(t);
	}
	function Hu(e, t, n, r) {
		var i = (n & 335544064) === n;
		i && t.alternate === null && t.return !== null && t.return.alternate !== null && iu(t);
		var a = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Vu(e, t, n, r), a & 2048 && El(9, t);
				break;
			case 1:
				Vu(e, t, n, r);
				break;
			case 3:
				Vu(e, t, n, r), i && hu && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && Ia(a)));
				break;
			case 12:
				if (a & 2048) {
					Vu(e, t, n, r), a = t.stateNode;
					try {
						var o = t.memoizedProps, s = o.id, c = o.onPostCommit;
						typeof c == "function" && c(s, t.alternate === null ? "mount" : "update", a.passiveEffectDuration, -0);
					} catch (e) {
						Z(t, t.return, e);
					}
				} else Vu(e, t, n, r);
				break;
			case 31:
				Vu(e, t, n, r);
				break;
			case 13:
				Vu(e, t, n, r);
				break;
			case 23: break;
			case 22:
				o = t.stateNode, s = t.alternate, t.memoizedState === null ? (i && s !== null && s.memoizedState !== null && iu(t), o._visibility & 2 ? Vu(e, t, n, r) : (o._visibility |= 2, Uu(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))) : (i && s !== null && s.memoizedState === null && iu(s), o._visibility & 2 ? Vu(e, t, n, r) : Wu(e, t)), a & 2048 && zu(s, t);
				break;
			case 24:
				Vu(e, t, n, r), a & 2048 && Bu(t.alternate, t);
				break;
			case 30:
				i && (a = t.alternate, a !== null && (Zl(a.child, !0), Zl(t.child, !0))), Vu(e, t, n, r);
				break;
			default: Vu(e, t, n, r);
		}
	}
	function Uu(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Uu(a, o, s, c, i), El(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Uu(a, o, s, c, i)) : u._visibility & 2 ? Uu(a, o, s, c, i) : Wu(a, o), i && l & 2048 && zu(o.alternate, o);
					break;
				case 24:
					Uu(a, o, s, c, i), i && l & 2048 && Bu(o.alternate, o);
					break;
				default: Uu(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Wu(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Wu(n, r), i & 2048 && zu(r.alternate, r);
					break;
				case 24:
					Wu(n, r), i & 2048 && Bu(r.alternate, r);
					break;
				default: Wu(n, r);
			}
			t = t.sibling;
		}
	}
	var Gu = 8192;
	function Ku(e, t, n) {
		if (e.subtreeFlags & Gu) for (e = e.child; e !== null;) qu(e, t, n), e = e.sibling;
	}
	function qu(e, t, n) {
		switch (e.tag) {
			case 26:
				Ku(e, t, n), e.flags & Gu && (e.memoizedState === null ? (e = e.stateNode, (t & 335544128) === t && Zm(n, e)) : Qm(n, Au, e.memoizedState, e.memoizedProps));
				break;
			case 5:
				Ku(e, t, n), e.flags & Gu && (e = e.stateNode, (t & 335544128) === t && Zm(n, e));
				break;
			case 3:
			case 4:
				var r = Au;
				Au = bm(e.stateNode.containerInfo), Ku(e, t, n), Au = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Gu, Gu = 16777216, Ku(e, t, n), Gu = r) : Ku(e, t, n));
				break;
			case 30:
				if ((e.flags & Gu) !== 0 && (r = e.memoizedProps.name, r != null && r !== "auto")) {
					var i = e.stateNode;
					i.paired = null, Wl === null && (Wl = /* @__PURE__ */ new Map()), Wl.set(r, i);
				}
				Ku(e, t, n);
				break;
			default: Ku(e, t, n);
		}
	}
	function Ju(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Yu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				du = r, Qu(r, e);
			}
			Ju(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Xu(e), e = e.sibling;
	}
	function Xu(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Yu(e), e.flags & 2048 && Dl(9, e, e.return);
				break;
			case 3:
				Yu(e);
				break;
			case 12:
				Yu(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Zu(e)) : Yu(e);
				break;
			default: Yu(e);
		}
	}
	function Zu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				du = r, Qu(r, e);
			}
			Ju(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Dl(8, t, t.return), Zu(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Zu(t));
					break;
				default: Zu(t);
			}
			e = e.sibling;
		}
	}
	function Qu(e, t) {
		for (; du !== null;) {
			var n = du;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Dl(8, n, t);
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
			if (r = n.child, r !== null) r.return = n, du = r;
			else a: for (n = e; du !== null;) {
				r = du;
				var i = r.sibling, a = r.return;
				if (xu(r), r === n) {
					du = null;
					break a;
				}
				if (i !== null) {
					i.return = a, du = i;
					break a;
				}
				du = a;
			}
		}
	}
	var $u = {
		getCacheForType: function(e) {
			var t = Oa(Pa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return Oa(Pa).controller.signal;
		}
	}, ed = typeof WeakMap == "function" ? WeakMap : Map, G = 0, K = null, q = null, J = 0, Y = 0, td = null, nd = !1, rd = !1, id = !1, ad = 0, od = 0, sd = 0, cd = 0, ld = 0, ud = 0, dd = 0, fd = null, pd = null, md = !1, hd = 0, gd = 0, _d = Infinity, vd = null, yd = null, bd = 0, X = null, xd = null, Sd = 0, Cd = 0, wd = null, Td = null, Ed = null, Dd = null, Od = null, kd = 0, Ad = null;
	function jd() {
		return G & 2 && J !== 0 ? J & -J : O.T === null ? Et() : Pf();
	}
	function Md() {
		if (ud === 0) {
			if (!(J & 536870912) || I) {
				var e = ut;
				ut <<= 1, !(ut & 3932160) && (ut = 262144), ud = e;
			} else ud = 536870912;
		}
		return e = Po.current, e !== null && (e.flags |= 32), ud;
	}
	function Nd(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(xi(e.memoizedProps, n))), Dd === null && (Dd = []), Dd.push(t.bind(null, r));
		}
	}
	function Pd(e, t, n) {
		(e === K && (Y === 2 || Y === 9) || e.cancelPendingCommit !== null) && (Vd(e, 0), Rd(e, J, ud, !1)), yt(e, n), (!(G & 2) || e !== K) && (e === K && (!(G & 2) && (cd |= n), od === 4 && Rd(e, J, ud, !1)), Ef(e));
	}
	function Fd(e, t, n) {
		if (G & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || mt(e, t), a = r ? Yd(e, t) : qd(e, t, !0), o = r;
		do {
			if (a === 0) {
				rd && !r && Rd(e, t, 0, !1);
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
						a = fd;
						var l = c.current.memoizedState.isDehydrated;
						if (l && (Vd(c, s).flags |= 256), s = qd(c, s, !1), s !== 2 && s !== 6) {
							if (id && !l) {
								c.errorRecoveryDisabledLanes |= o, cd |= o, a = 4;
								break a;
							}
							o = pd, pd = a, o !== null && (pd === null ? pd = o : pd.push.apply(pd, o));
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
						Rd(r, t, ud, !nd);
						break a;
					case 2:
						pd = null;
						break;
					case 3:
					case 5: break;
					default: throw Error(i(329));
				}
				if ((t & 62914560) === t && (a = hd + 300 - qe(), 10 < a)) {
					if (Rd(r, t, ud, !nd), pt(r, 0, !0) !== 0) break a;
					Sd = t, r.timeoutHandle = gp(Id.bind(null, r, n, pd, vd, md, t, ud, cd, dd, nd, o, "Throttled", -0, 0), a);
					break a;
				}
				Id(r, n, pd, vd, md, t, ud, cd, dd, nd, o, null, -0, 0);
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
			unsuspend: Tn
		}, Wl = null, qu(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? hd - qe() : (a & 4194048) === a ? gd - qe() : 0, m = eh(d, m), m !== null)) {
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
					if (!Gr(a(), i)) return !1;
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
		t = ht(e, t), t &= ~ld, t &= ~cd, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - at(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && xt(e, n, t);
	}
	function zd() {
		return G & 6 ? !0 : (Df(0, !1), !1);
	}
	function Bd() {
		if (q !== null) {
			if (Y === 0) var e = q.return;
			else e = q, xa = ba = null, cs(e), co = null, lo = 0, e = q;
			for (; e !== null;) Tl(e.alternate, e), e = e.return;
			q = null;
		}
	}
	function Vd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), Sd = 0, Bd(), K = e, q = n = Ri(e.current, null), J = t, Y = 0, td = null, nd = !1, rd = mt(e, t), id = !1, dd = ud = ld = cd = sd = od = 0, pd = fd = null, md = !1, ad = ht(e, t), Oi(), n;
	}
	function Hd(e, t) {
		R = null, O.H = vc, t === Qa || t === eo ? (t = oo(), Y = 3) : t === $a ? (t = oo(), Y = 4) : Y = t === Ic ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, td = t, q === null && (od = 1, Ac(e, Ki(t, e.current)));
	}
	function Ud() {
		var e = Po.current;
		return e === null ? !0 : (J & 4194048) === J ? Fo === null : (J & 62914560) === J || J & 536870912 ? e === Fo : !1;
	}
	function Wd() {
		var e = O.H;
		return O.H = vc, e === null ? vc : e;
	}
	function Gd() {
		var e = O.A;
		return O.A = $u, e;
	}
	function Kd() {
		od = 4, nd || (J & 4194048) !== J && Po.current !== null || (rd = !0), !(sd & 134217727) && !(cd & 134217727) || K === null || Rd(K, J, ud, !1);
	}
	function qd(e, t, n) {
		var r = G;
		G |= 2;
		var i = Wd(), a = Gd();
		(K !== e || J !== t) && (vd = null, Vd(e, t)), t = !1;
		var o = od;
		a: do
			try {
				if (Y !== 0 && q !== null) {
					var s = q, c = td;
					switch (Y) {
						case 8:
							Bd(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							Po.current === null && (t = !0);
							var l = Y;
							if (Y = 0, td = null, $d(e, s, c, l), n && rd) {
								o = 0;
								break a;
							}
							break;
						default: l = Y, Y = 0, td = null, $d(e, s, c, l);
					}
				}
				Jd(), o = od;
				break;
			} catch (t) {
				Hd(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, xa = ba = null, G = r, O.H = i, O.A = a, q === null && (K = null, J = 0, Oi()), o;
	}
	function Jd() {
		for (; q !== null;) Zd(q);
	}
	function Yd(e, t) {
		var n = G;
		G |= 2;
		var r = Wd(), a = Gd();
		K !== e || J !== t ? (vd = null, _d = qe() + 500, Vd(e, t)) : rd = mt(e, t);
		a: do
			try {
				if (Y !== 0 && q !== null) {
					t = q;
					var o = td;
					b: switch (Y) {
						case 1:
							Y = 0, td = null, $d(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (no(o)) {
								Y = 0, td = null, Qd(t);
								break;
							}
							t = function() {
								Y !== 2 && Y !== 9 || K !== e || (Y = 7), Ef(e);
							}, o.then(t, t);
							break a;
						case 3:
							Y = 7;
							break a;
						case 4:
							Y = 5;
							break a;
						case 7:
							no(o) ? (Y = 0, td = null, Qd(t)) : (Y = 0, td = null, $d(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (q.tag) {
								case 26: s = q.memoizedState;
								case 5:
								case 27:
									var c = q;
									if (s ? Ym(s) : c.stateNode.complete) {
										Y = 0, td = null;
										var l = c.sibling;
										if (l !== null) q = l;
										else {
											var u = c.return;
											u === null ? q = null : (q = u, ef(u));
										}
										break b;
									}
							}
							Y = 0, td = null, $d(e, t, o, 5);
							break;
						case 6:
							Y = 0, td = null, $d(e, t, o, 6);
							break;
						case 8:
							Bd(), od = 6;
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
		return xa = ba = null, O.H = r, O.A = a, G = n, q === null ? (K = null, J = 0, Oi(), od) : 0;
	}
	function Xd() {
		for (; q !== null && !Ge();) Zd(q);
	}
	function Zd(e) {
		var t = gl(e.alternate, e, ad);
		e.memoizedProps = e.pendingProps, t === null ? ef(e) : q = t;
	}
	function Qd(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = Xc(n, t, t.pendingProps, t.type, void 0, J);
				break;
			case 11:
				t = Xc(n, t, t.pendingProps, t.type.render, t.ref, J);
				break;
			case 5:
				cs(t);
				var r = t;
				r === sa && (I ? (ma(r), r.tag === 5 && r.stateNode != null && (ca = r.stateNode)) : (ma(r), I = !0));
			default: Tl(n, t), t = q = zi(t, ad), t = gl(n, t, ad);
		}
		e.memoizedProps = e.pendingProps, t === null ? ef(e) : q = t;
	}
	function $d(e, t, n, r) {
		xa = ba = null, cs(t), co = null, lo = 0;
		var i = t.return;
		try {
			if (Fc(e, i, t, n, J)) {
				od = 1, Ac(e, Ki(n, e.current)), q = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw q = i, t;
			od = 1, Ac(e, Ki(n, e.current)), q = null;
			return;
		}
		t.flags & 32768 ? (I || r === 1 ? e = !0 : rd || J & 536870912 ? e = !1 : (nd = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = Po.current, r !== null && r.tag === 13 && (r.flags |= 16384))), tf(t, e)) : ef(t);
	}
	function ef(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				tf(t, nd);
				return;
			}
			e = t.return;
			var n = Cl(t.alternate, t, ad);
			if (n !== null) {
				q = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				q = t;
				return;
			}
			q = t = e;
		} while (t !== null);
		od === 0 && (od = 5);
	}
	function tf(e, t) {
		do {
			var n = wl(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, q = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				q = e;
				return;
			}
			q = e = n;
		} while (e !== null);
		od = 6, q = null;
	}
	function nf(e, t, n, r, a, o, s, c, l, u, d, f) {
		e.cancelPendingCommit = null;
		do
			df();
		while (bd !== 0);
		if (G & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			e === K && (q = K = null, J = 0), xd = t, X = e, Sd = n, wd = a, Td = r, rf(e, t, n, s, c, l, f);
		}
	}
	function rf(e, t, n, r, i, a, o) {
		var s = t.lanes | t.childLanes;
		if (Cd = s, s |= Di, bt(e, n, s, r, i, a), Dd = null, (n & 335544064) === n ? (Od = za(e), r = 10262) : (Od = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, yf(Ze, function() {
			return ff(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Ul = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = O.T, O.T = null, i = k.p, k.p = 2, a = G, G |= 4;
			try {
				gu(e, t, n);
			} finally {
				G = a, k.p = i, O.T = r;
			}
		}
		bd = 1, Ul ? Ed = Mp(o, e.containerInfo, Od, sf, cf, of, lf, ff, af, null, null) : (sf(), cf(), lf());
	}
	function af(e) {
		if (bd !== 0) {
			var t = X.onRecoverableError;
			t(e, { componentStack: null });
		}
	}
	function of() {
		bd === 3 && (bd = 0, Fu(xd, X), bd = 4);
	}
	function sf() {
		if (bd === 1) {
			bd = 0;
			var e = X, t = xd, n = Sd, r = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || r) {
				r = O.T, O.T = null;
				var i = k.p;
				k.p = 2;
				var a = G;
				G |= 4;
				try {
					pu = mu = !1, ju(t, e, n), n = cp;
					var o = Zr(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && Xr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Qr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Yr(s, h), v = Yr(s, g);
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
					G = a, k.p = i, O.T = r;
				}
			}
			e.current = t, bd = 2;
		}
	}
	function cf() {
		if (bd === 2) {
			bd = 0;
			var e = X, t = xd, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = O.T, O.T = null;
				var r = k.p;
				k.p = 2;
				var i = G;
				G |= 4;
				try {
					vu(e, t.alternate, t);
				} finally {
					G = i, k.p = r, O.T = n;
				}
			}
			bd = 3;
		}
	}
	function lf() {
		if (bd === 4 || bd === 3) {
			bd = 0;
			var e = Ed;
			Ed = null, Ke();
			var t = X, n = xd, r = Sd, i = Td, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? bd = 5 : (bd = 0, xd = X = null, uf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (yd = null), Tt(r), n = n.stateNode, rt && typeof rt.onCommitFiberRoot == "function") try {
				rt.onCommitFiberRoot(nt, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = O.T, a = k.p, k.p = 2, O.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					O.T = n, k.p = a;
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
		if (bd !== 5) return !1;
		var e = X, t = Cd;
		Cd = 0;
		var n = Tt(Sd), r = O.T, a = k.p;
		try {
			k.p = 32 > n ? 32 : n, O.T = null, n = wd, wd = null;
			var o = X, s = Sd;
			if (bd = 0, xd = X = null, Sd = 0, G & 6) throw Error(i(331));
			var c = G;
			if (G |= 4, Xu(o.current), Hu(o, o.current, s, n), G = c, Df(0, !1), rt && typeof rt.onPostCommitFiberRoot == "function") try {
				rt.onPostCommitFiberRoot(nt, o);
			} catch {}
			return !0;
		} finally {
			k.p = a, O.T = r, uf(e, t);
		}
	}
	function pf(e, t, n) {
		t = Ki(n, t), t = Mc(e.stateNode, t, 2), e = xo(e, t, 2), e !== null && (yt(e, 2), Ef(e));
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
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (yd === null || !yd.has(r))) {
					e = Ki(n, e), n = Nc(2), r = xo(t, n, 2), r !== null && (Pc(n, r, t, e), yt(r, 2), Ef(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function mf(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new ed();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (id = !0, i.add(n), e = hf.bind(null, e, t, n), t.then(e, e));
	}
	function hf(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, K === e && (J & n) === n && (od === 4 || od === 3 && (J & 62914560) === J && 300 > qe() - hd ? G & 2 ? ld |= n : Vd(e, 0) : ld |= n, dd === J && (dd = 0)), Ef(e);
	}
	function gf(e, t) {
		t === 0 && (t = _t()), e = ji(e, t), e !== null && (yt(e, t), Ef(e));
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
		return Ue(e, t);
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
								a = (1 << 31 - at(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, Mf(r, a));
						} else a = J, a = pt(r, r === K ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || mt(r, a) || (n = !0, Mf(r, a));
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
		for (var t = qe(), n = null, r = bf; r !== null;) {
			var i = r.next, a = Af(r, t);
			a === 0 ? (r.next = null, n === null ? bf = i : n.next = i, i === null && (xf = n)) : (n = r, (e !== 0 || a & 3) && (Cf = !0)), r = i;
		}
		bd !== 0 && bd !== 5 || Df(e, !1), Tf !== 0 && (Tf = 0);
	}
	function Af(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - at(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = gt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = K, n = J, n = pt(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Y === 2 || Y === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && We(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || mt(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && We(r), Tt(n)) {
				case 2:
				case 8:
					n = Xe;
					break;
				case 32:
					n = Ze;
					break;
				case 268435456:
					n = $e;
					break;
				default: n = Ze;
			}
			return r = jf.bind(null, e), n = Ue(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && We(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function jf(e, t) {
		if (bd !== 0 && bd !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (df() && e.callbackNode !== n) return null;
		var r = J;
		return r = pt(e, e === K ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Fd(e, r, t), Af(e, qe()), e.callbackNode != null && e.callbackNode === n ? jf.bind(null, e) : null);
	}
	function Mf(e, t) {
		if (df()) return null;
		Fd(e, t, !0);
	}
	function Nf() {
		bp(function() {
			G & 6 ? Ue(Ye, Of) : kf();
		});
	}
	function Pf() {
		if (Tf === 0) {
			var e = Ha;
			e === 0 && (e = lt, lt <<= 1, !(lt & 261888) && (lt = 256)), Tf = e;
		}
		return Tf;
	}
	function Ff(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : wn(e);
	}
	function If(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Ff((i[At] || null).action), o = r.submitter;
			o && (t = (t = o[At] || null) ? Ff(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new Kn("action", "action", null, r, i);
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
	for (var Lf = 0; Lf < vi.length; Lf++) {
		var Rf = vi[Lf];
		yi(Rf.toLowerCase(), "on" + (Rf[0].toUpperCase() + Rf.slice(1)));
	}
	yi(ui, "onAnimationEnd"), yi(di, "onAnimationIteration"), yi(fi, "onAnimationStart"), yi("dblclick", "onDoubleClick"), yi("focusin", "onFocus"), yi("focusout", "onBlur"), yi(pi, "onTransitionRun"), yi(mi, "onTransitionStart"), yi(hi, "onTransitionCancel"), yi(gi, "onTransitionEnd"), Jt("onMouseEnter", ["mouseout", "mouseover"]), Jt("onMouseLeave", ["mouseout", "mouseover"]), Jt("onPointerEnter", ["pointerout", "pointerover"]), Jt("onPointerLeave", ["pointerout", "pointerover"]), qt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), qt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), qt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), qt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), qt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), qt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
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
						wi(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						wi(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Q(e, t) {
		var n = t[Mt];
		n === void 0 && (n = t[Mt] = /* @__PURE__ */ new Set());
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
			e[Uf] = !0, Gt.forEach(function(t) {
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
		n = i.bind(null, t, n, e), i = void 0, !Fn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
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
					if (s = zt(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		Mn(function() {
			var r = a, i = Dn(n), s = [];
			a: {
				var c = _i.get(e);
				if (c !== void 0) {
					var l = Kn, u = e;
					switch (e) {
						case "keypress": if (Vn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = lr;
							break;
						case "focusin":
							u = "focus", l = tr;
							break;
						case "focusout":
							u = "blur", l = tr;
							break;
						case "beforeblur":
						case "afterblur":
							l = tr;
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
							l = $n;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = er;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = fr;
							break;
						case ui:
						case di:
						case fi:
							l = nr;
							break;
						case gi:
							l = pr;
							break;
						case "scroll":
						case "scrollend":
							l = Jn;
							break;
						case "wheel":
							l = mr;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = N;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = ur;
							break;
						case "submit":
							l = dr;
							break;
						case "toggle":
						case "beforetoggle": l = hr;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = Nn(m, p), g != null && d.push(qf(m, g, h))), f) break;
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
					if (l = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", l && n !== En && (u = n.relatedTarget || n.fromElement) && (zt(u) || u[jt])) break a;
					(c || l) && (u = i.window === i ? i : (l = i.ownerDocument) ? l.defaultView || l.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? zt(l) : null, l !== null && (f = o(l), d = l.tag, l !== f || d !== 5 && d !== 27 && d !== 6) && (l = null)) : (c = null, l = r), c !== l && (d = $n, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = ur, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = c == null ? u : Vt(c), h = l == null ? u : Vt(l), u = new d(g, m + "leave", c, n, i), u.target = f, u.relatedTarget = h, g = null, zt(i) === r && (d = new d(p, m + "enter", l, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = c && l ? E(c, l, Yf) : null, c !== null && Xf(s, u, c, d, !1), l !== null && f !== null && Xf(s, f, l, d, !0)));
				}
				a: {
					if (c = r ? Vt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var _ = Fr;
					else if (kr(c)) {
						if (P) _ = Ur;
						else {
							_ = Hr;
							var v = Vr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && xn(r.elementType) && (_ = Fr) : _ = F;
					if (_ &&= _(e, r)) {
						Ar(s, _, n, i);
						break a;
					}
					v && v(e, c, r);
				}
				switch (v = r ? Vt(r) : window, e) {
					case "focusin":
						(kr(v) || v.contentEditable === "true") && (ei = v, ti = r, ni = null);
						break;
					case "focusout":
						ni = ti = ei = null;
						break;
					case "mousedown":
						ri = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						ri = !1, ii(s, n, i);
						break;
					case "selectionchange": if ($r) break;
					case "keydown":
					case "keyup": ii(s, n, i);
				}
				var y;
				if (_r) b: {
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
				else Tr ? Cr(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (br && n.locale !== "ko" && (Tr || b !== "onCompositionStart" ? b === "onCompositionEnd" && Tr && (y = Bn()) : (Ln = i, Rn = "value" in Ln ? Ln.value : Ln.textContent, Tr = !0)), v = Jf(r, b), 0 < v.length && (b = new rr(b, e, null, n, i), s.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = wr(n), y !== null && (b.data = y)))), (y = yr ? Er(e, n) : Dr(e, n)) && (b = Jf(r, "onBeforeInput"), 0 < b.length && (v = new rr("onBeforeInput", "beforeinput", null, n, i), s.push({
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
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = Nn(e, n), i != null && r.unshift(qf(e, i, a)), i = Nn(e, t), i != null && r.push(qf(e, i, a))), e.tag === 3) return r;
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
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = Nn(n, a), l != null && o.unshift(qf(n, l, c))) : i || (l = Nn(n, a), l != null && o.push(qf(n, l, c)))), n = n.return;
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
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || _n(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && _n(e, "" + r);
				else return;
				break;
			case "className":
				tn(e, "class", r);
				break;
			case "tabIndex":
				tn(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				tn(e, n, r);
				break;
			case "style":
				bn(e, r, o);
				return;
			case "data": if (t !== "object") {
				tn(e, "data", r);
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
				r = wn(r), e.setAttribute(n, r);
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
				r = wn(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = Tn);
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
				n = wn(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
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
				Q("beforetoggle", e), Q("toggle", e), en(e, "popover", r);
				break;
			case "xlinkActuate":
				nn(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				nn(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				nn(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				nn(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				nn(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				nn(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				nn(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				nn(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				nn(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				en(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = Sn.get(n) || n, en(e, n, r);
			else return;
		}
		M = !0;
	}
	function tp(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				bn(e, r, o);
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
				if (typeof r == "string") _n(e, r);
				else if (typeof r == "number" || typeof r == "bigint") _n(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = Tn);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!Kt.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), o = n.slice(2, a ? n.length - 7 : void 0), t = e[At] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(o, t, a), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(o, r, a);
						break a;
					}
					M = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : en(e, n, r);
				}
				return;
		}
		M = !0;
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
				fn(e, o, c, l, u, s, a, !1);
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
				t = o, n = s, e.multiple = !!r, t == null ? n != null && mn(e, !!r, n, !0) : mn(e, !!r, t, !1);
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
				gn(e, r, a, o);
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
			default: if (xn(t)) {
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
							m !== f && (M = !0), o = m;
							break;
						case "name":
							m !== f && (M = !0), a = m;
							break;
						case "checked":
							m !== f && (M = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (M = !0), d = m;
							break;
						case "value":
							m !== f && (M = !0), s = m;
							break;
						case "defaultValue":
							m !== f && (M = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && $(e, t, p, m, r, f);
					}
				}
				dn(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || $(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						o !== l && (M = !0), p = o;
						break;
					case "defaultValue":
						o !== l && (M = !0), c = o;
						break;
					case "multiple": o !== l && (M = !0), s = o;
					default: o !== l && $(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? mn(e, !!n, n ? [] : "", !1) : mn(e, !!n, t, !0)) : mn(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: $(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						a !== o && (M = !0), p = a;
						break;
					case "defaultValue":
						a !== o && (M = !0), m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && $(e, t, s, a, r, o);
				}
				hn(e, p, m);
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
						p !== m && (M = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
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
			default: if (xn(t)) {
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
		return n = lp(n).createElement(e), n[kt] = r, n[At] = t, np(n, e, t), Ut(n), n;
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
						a[It] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
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
		return t = typeof t == "number" ? { duration: t } : D({}, t), t.pseudoElement = this._selector, this._scope.animate(e, t);
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
		var a = zt(i);
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
		return e & Node.DOCUMENT_POSITION_PRECEDING ? ((t = !!a) && !(t = a === n) && (t = E(n, a, T), t === null ? t = !1 : (h(t, !0, C, a, n), a = x, x = null, t = a !== null)), t) : e & Node.DOCUMENT_POSITION_FOLLOWING ? ((t = !!a) && !(t = a === r) && (t = E(r, a, T), t === null ? t = !1 : (h(t, !0, w, a, r), a = x, S = x = null, t = a !== null)), t) : !1;
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
					nm(n), Rt(n);
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
			} else if (!e[It]) switch (t) {
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
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === Tn && (e.onclick = null), Rt(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		Rt(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = k.d;
	k.d = {
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
		var t = Bt(e);
		t !== null && t.tag === 5 && t.type === "form" ? oc(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = un(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), Ut(t), r.head.appendChild(t)));
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
			var i = "link[rel=\"preload\"][as=\"" + un(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + un(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + un(n.imageSizes) + "\"]")) : i += "[href=\"" + un(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Pm(e);
					break;
				case "script": a = Rm(e);
			}
			if (!(vm.has(a) || (e = D({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), vm.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(Fm(a)) || t === "script" && r.querySelector(zm(a))))) {
				var o = r.createElement("link");
				np(o, "link", e), t === "style" && (o[Lt] = !0, o.onload = o.onerror = function() {
					Wt(o);
				}), Ut(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + un(r) + "\"][href=\"" + un(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Rm(e);
			}
			if (!vm.has(a) && (e = D({
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
				r = n.createElement("link"), np(r, "link", e), Ut(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = Ht(r).hoistableStyles, a = Pm(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(Fm(a))) s.loading = 5;
				else {
					e = D({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = vm.get(a)) && Hm(e, n);
					var c = o = r.createElement("link");
					Ut(c), np(c, "link", e), c._p = new Promise(function(e, t) {
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
			var r = Ht(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Ut(a), np(a, "link", e), n.head.appendChild(a)), a = {
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
			var r = Ht(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Ut(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var a = (a = ke.current) ? bm(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = Ht(a).hoistableStyles, r = t.get(n), r || (r = {
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
					var o = Ht(a).hoistableStyles, s = o.get(e);
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
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = Ht(a).hoistableScripts, r = t.get(n), r || (r = {
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
		return "href=\"" + un(e) + "\"";
	}
	function Fm(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Im(e) {
		return D({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Lm(e, t, n, r) {
		if (t = e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]")) {
			if (!0 !== t[Lt]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[Lt] = !0, t.onload = t.onerror = Wt.bind(null, t), np(t, "link", n), Ut(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + un(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + un(n.href) + "\"]");
				if (r) return t.instance = r, Ut(r), r;
				var a = D({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Ut(r), np(r, "style", a), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Pm(n.href);
				var o = e.querySelector(Fm(a));
				if (o) return t.state.loading |= 4, t.instance = o, Ut(o), o;
				r = Im(n), (a = vm.get(a)) && Hm(r, a), o = (e.ownerDocument || e).createElement("link"), Ut(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), np(o, "link", r), t.state.loading |= 4, Vm(o, n.precedence, e), t.instance = o;
			case "script": return o = Rm(n.src), (a = e.querySelector(zm(o))) ? (t.instance = a, Ut(a), a) : (r = n, (a = vm.get(o)) && (r = D({}, n), Um(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), Ut(a), np(a, "link", r), e.head.appendChild(a), t.instance = a);
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
			if (!(a[It] || a[kt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
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
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Ut(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), Ut(a);
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
		$$typeof: se,
		Provider: null,
		Consumer: null,
		_currentValue: Ce,
		_currentValue2: Ce,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = vt(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = vt(0), this.hiddenUpdates = vt(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = Ii(3, null, null, t), e.current = a, a.stateNode = e, t = Fa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, vo(a), e;
	}
	function uh(e) {
		return e ? (e = Pi, e) : Pi;
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
			var t = ji(e, 67108864);
			t !== null && Pd(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = jd();
			t = wt(t);
			var n = ji(e, t);
			n !== null && Pd(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = O.T;
		O.T = null;
		var a = k.p;
		try {
			k.p = 2, yh(e, t, n, r);
		} finally {
			k.p = a, O.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = O.T;
		O.T = null;
		var a = k.p;
		try {
			k.p = 8, yh(e, t, n, r);
		} finally {
			k.p = a, O.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) Kf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = Bt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = ft(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - at(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Ef(a), !(G & 6) && (_d = qe() + 500, Df(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = ji(a, 2), s !== null && Pd(s, a, 2), zd(), ph(a, 2);
					}
					if (a = bh(r), a === null && Kf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Kf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = Dn(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = zt(e), e !== null) {
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
			case "message": switch (Je()) {
				case Ye: return 2;
				case Xe: return 8;
				case Ze:
				case Qe: return 32;
				case $e: return 268435456;
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
		}, t !== null && (t = Bt(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
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
		var t = zt(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, Dt(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, Dt(e.priority, function() {
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
				En = r, n.target.dispatchEvent(r), En = null;
			} else return t = Bt(n), t !== null && mh(t), e.blockedOn = n, !1;
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
				var a = Bt(n);
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
			var i = n[r], a = n[r + 1], o = i[At] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[At] || null) s = o.formAction;
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
			dh(e.current, 2, null, e, null, null), zd(), t[jt] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = Et();
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
	k.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var qh = {
		bundleType: 0,
		version: "19.3.0",
		rendererPackageName: "react-dom",
		currentDispatcherRef: O,
		reconcilerVersion: "19.3.0"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Jh = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Jh.isDisabled && Jh.supportsFiber) try {
			nt = Jh.inject(qh), rt = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Dc, s = Oc, c = kc;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, o, s, c, Uh), e[jt] = t.current, Wf(e), new Wh(t);
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
function x(e) {
	return typeof e == "object" && !!e && "pathname" in e && "search" in e && "hash" in e && "state" in e && "key" in e;
}
function S(e = {}) {
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
		let a = E(i ? l().pathname : "/", e, t, n, r);
		return w(a.pathname.charAt(0) === "/", `relative pathnames are not supported in memory history: ${JSON.stringify(e)}`), a;
	}
	function d(e) {
		return typeof e == "string" ? e : D(e);
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
			let t = typeof e == "string" ? ee(e) : e;
			return {
				pathname: t.pathname || "",
				search: t.search || "",
				hash: t.hash || ""
			};
		},
		push(e, t) {
			o = "PUSH";
			let n = x(e) ? e : u(e, t);
			a += 1, i.splice(a, i.length, n), r && s && s({
				action: o,
				location: n,
				delta: 1
			});
		},
		replace(e, t) {
			o = "REPLACE";
			let n = x(e) ? e : u(e, t);
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
function C(e, t) {
	if (e === !1 || e == null) throw Error(t);
}
function w(e, t) {
	if (!e) {
		typeof console < "u" && console.warn(t);
		try {
			throw Error(t);
		} catch {}
	}
}
function T() {
	return Math.random().toString(36).substring(2, 10);
}
function E(e, t, n = null, r, i) {
	return {
		pathname: typeof e == "string" ? e : e.pathname,
		search: "",
		hash: "",
		...typeof t == "string" ? ee(t) : t,
		state: n,
		key: t && t.key || r || T(),
		mask: i
	};
}
function D({ pathname: e = "/", search: t = "", hash: n = "" }) {
	return t && t !== "?" && (e += t.charAt(0) === "?" ? t : "?" + t), n && n !== "#" && (e += n.charAt(0) === "#" ? n : "#" + n), e;
}
function ee(e) {
	let t = {};
	if (e) {
		let n = e.indexOf("#");
		n >= 0 && (t.hash = e.substring(n), e = e.substring(0, n));
		let r = e.indexOf("?");
		r >= 0 && (t.search = e.substring(r), e = e.substring(0, r)), e && (t.pathname = e);
	}
	return t;
}
function te(e, t, n = "/") {
	return ne(e, t, n, !1);
}
function ne(e, t, n, r, i) {
	let a = xe((typeof t == "string" ? ee(t) : t).pathname || "/", n);
	if (a == null) return null;
	let o = i ?? re(e), s = null, c = be(a);
	for (let e = 0; s == null && e < o.length; ++e) s = ge(o[e], c, r);
	return s;
}
function re(e) {
	let t = ie(e);
	return oe(t), t;
}
function ie(e, t = [], n = [], r = "", i = !1) {
	let a = (e, a, o = i, s) => {
		let c = {
			relativePath: s === void 0 ? e.path || "" : s,
			caseSensitive: e.caseSensitive === !0,
			childrenIndex: a,
			route: e
		};
		if (c.relativePath.startsWith("/")) {
			if (!c.relativePath.startsWith(r) && o) return;
			C(c.relativePath.startsWith(r), `Absolute route path "${c.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`), c.relativePath = c.relativePath.slice(r.length);
		}
		let l = A([r, c.relativePath]), u = n.concat(c);
		e.children && e.children.length > 0 && (C(e.index !== !0, `Index routes must not have child routes. Please remove all child routes from route path "${l}".`), ie(e.children, t, u, l, o)), (e.path != null || e.index) && t.push({
			path: l,
			score: me(l, e.index),
			routesMeta: u.map((e, t) => {
				let [n, r] = ye(e.relativePath, e.caseSensitive, t === u.length - 1);
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
		else for (let n of ae(e.path)) a(e, t, !0, n);
	}), t;
}
function ae(e) {
	let t = e.split("/");
	if (t.length === 0) return [];
	let [n, ...r] = t, i = n.endsWith("?"), a = n.replace(/\?$/, "");
	if (r.length === 0) return i ? [a, ""] : [a];
	let o = ae(r.join("/")), s = [];
	return s.push(...o.map((e) => e === "" ? a : [a, e].join("/"))), i && s.push(...o), s.map((t) => e.startsWith("/") && t === "" ? "/" : t);
}
function oe(e) {
	e.sort((e, t) => e.score === t.score ? he(e.routesMeta.map((e) => e.childrenIndex), t.routesMeta.map((e) => e.childrenIndex)) : t.score - e.score);
}
var se = /^:[\w-]+$/, ce = 3, le = 2, ue = 1, de = 10, fe = -2, pe = (e) => e === "*";
function me(e, t) {
	let n = e.split("/"), r = n.length;
	return n.some(pe) && (r += fe), t && (r += le), n.filter((e) => !pe(e)).reduce((e, t) => e + (se.test(t) ? ce : t === "" ? ue : de), r);
}
function he(e, t) {
	return e.length === t.length && e.slice(0, -1).every((e, n) => e === t[n]) ? e[e.length - 1] - t[t.length - 1] : 0;
}
function ge(e, t, n = !1) {
	let { routesMeta: r } = e, i = {}, a = "/", o = [];
	for (let e = 0; e < r.length; ++e) {
		let s = r[e], c = e === r.length - 1, l = a === "/" ? t : t.slice(a.length) || "/", u = {
			path: s.relativePath,
			caseSensitive: s.caseSensitive,
			end: c
		}, d = s.matcher && s.compiledParams ? ve(u, l, s.matcher, s.compiledParams) : _e(u, l), f = s.route;
		if (!d && c && n && !r[r.length - 1].route.index && (d = _e({
			path: s.relativePath,
			caseSensitive: s.caseSensitive,
			end: !1
		}, l)), !d) return null;
		Object.assign(i, d.params), o.push({
			params: i,
			pathname: A([a, d.pathname]),
			pathnameBase: De(A([a, d.pathnameBase])),
			route: f
		}), d.pathnameBase !== "/" && (a = A([a, d.pathnameBase]));
	}
	return o;
}
function _e(e, t) {
	typeof e == "string" && (e = {
		path: e,
		caseSensitive: !1,
		end: !0
	});
	let [n, r] = ye(e.path, e.caseSensitive, e.end);
	return ve(e, t, n, r);
}
function ve(e, t, n, r) {
	let i = t.match(n);
	if (!i) return null;
	let a = i[0], o = j(a, 1), s = i.slice(1);
	return {
		params: r.reduce((e, { paramName: t, isOptional: n }, r) => {
			if (t === "*") {
				let e = s[r] || "";
				o = j(a.slice(0, a.length - e.length), 1);
			}
			let i = s[r];
			return e[t] = n && !i ? void 0 : (i || "").replace(/%2F/g, "/"), e;
		}, {}),
		pathname: a,
		pathnameBase: o,
		pattern: e
	};
}
function ye(e, t = !1, n = !0) {
	w(e === "*" || !e.endsWith("*") || e.endsWith("/*"), `Route path "${e}" will be treated as if it were "${e.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/, "/*")}".`);
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
function be(e) {
	try {
		return e.split("/").map((e) => decodeURIComponent(e).replace(/\//g, "%2F")).join("/");
	} catch (t) {
		return w(!1, `The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`), e;
	}
}
function xe(e, t) {
	if (t === "/") return e;
	if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
	let n = t.endsWith("/") ? t.length - 1 : t.length, r = e.charAt(n);
	return r && r !== "/" ? null : e.slice(n) || "/";
}
function Se(e, t = "/") {
	let { pathname: n, search: r = "", hash: i = "" } = typeof e == "string" ? ee(e) : e, a;
	return n ? (n = Ee(n), a = n.startsWith("/") || n.startsWith("\\") ? O(n.substring(1), "/") : O(n, t)) : a = t, {
		pathname: a,
		search: Oe(r),
		hash: ke(i)
	};
}
function O(e, t) {
	let n = j(t).split("/");
	return e.split("/").forEach((e) => {
		e === ".." ? n.length > 1 && n.pop() : e !== "." && n.push(e);
	}), n.length > 1 ? n.join("/") : "/";
}
function k(e, t, n, r) {
	return `Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function Ce(e) {
	return e.filter((e, t) => t === 0 || e.route.path && e.route.path.length > 0);
}
function we(e) {
	let t = Ce(e);
	return t.map((e, n) => n === t.length - 1 ? e.pathname : e.pathnameBase);
}
function Te(e, t, n, r = !1) {
	let i;
	typeof e == "string" ? i = ee(e) : (i = { ...e }, C(!i.pathname || !i.pathname.includes("?"), k("?", "pathname", "search", i)), C(!i.pathname || !i.pathname.includes("#"), k("#", "pathname", "hash", i)), C(!i.search || !i.search.includes("#"), k("#", "search", "hash", i)));
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
	let c = Se(i, s), l = o && o !== "/" && o.endsWith("/"), u = (a || o === ".") && n.endsWith("/");
	return !c.pathname.endsWith("/") && (l || u) && (c.pathname += "/"), c;
}
var Ee = (e) => e.replace(/[\\/]{2,}/g, "/"), A = (e) => Ee(e.join("/"));
function j(e, t = 0) {
	let n = e.length;
	for (; n > t && e.charCodeAt(n - 1) === 47;) n--;
	return n === e.length ? e : e.slice(0, n);
}
var De = (e) => j(e).replace(/^\/*/, "/"), Oe = (e) => !e || e === "?" ? "" : e.startsWith("?") ? e : "?" + e, ke = (e) => !e || e === "#" ? "" : e.startsWith("#") ? e : "#" + e, Ae = class {
	constructor(e, t, n, r = !1) {
		this.status = e, this.statusText = t || "", this.internal = r, n instanceof Error ? (this.data = n.toString(), this.error = n) : this.data = n;
	}
};
function je(e) {
	return e != null && typeof e.status == "number" && typeof e.statusText == "string" && typeof e.internal == "boolean" && "data" in e;
}
function Me(e) {
	return A(e.map((e) => e.route.path).filter(Boolean)) || "/";
}
var Ne = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0;
function Pe(e, t) {
	let n = e;
	if (typeof n != "string" || !v.test(n)) return {
		absoluteURL: void 0,
		isExternal: !1,
		to: n
	};
	let r = n, i = !1;
	if (Ne) try {
		let e = new URL(window.location.href), r = y.test(n) ? new URL(b(n, e.protocol)) : new URL(n), a = xe(r.pathname, t);
		r.origin === e.origin && a != null ? n = a + r.search + r.hash : i = !0;
	} catch {
		w(!1, `<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`);
	}
	return {
		absoluteURL: r,
		isExternal: i,
		to: n
	};
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var Fe = new URL("http://localhost");
function Ie(e) {
	if (e.createURL) return e.createURL("/");
	try {
		return new URL(e.createHref("/"), Fe);
	} catch {
		return Fe;
	}
}
function Le(e, t) {
	return e.origin === t.origin && (e.origin !== "null" || e.protocol === t.protocol && e.host === t.host);
}
function Re(e, t) {
	if (e.startsWith("//")) return !0;
	let n = t.protocol.toLowerCase();
	return e.toLowerCase().startsWith(n) ? t.host === "" || e.slice(n.length).startsWith("//") : !1;
}
function ze(e, t, n, r) {
	let i = null;
	try {
		i = e == null ? null : new URL(e, n);
	} catch {}
	let a = new URL(t, n), o = i != null && !Le(i, n), s = !Le(a, n);
	if (r === "reject") {
		if (o || s) throw Error("External navigation is not allowed");
	} else if (s && (i == null || !Re(e, i) || !Le(i, a))) throw Error("External navigation is not allowed");
}
var Be = [
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
];
new Set(Be);
var Ve = ["GET", ...Be];
new Set(Ve);
var He = [
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
function Ue(e) {
	try {
		return He.includes(new URL(e).protocol);
	} catch {
		return !1;
	}
}
var We = _.createContext(null);
We.displayName = "DataRouter";
var Ge = _.createContext(null);
Ge.displayName = "DataRouterState";
var Ke = _.createContext(!1);
function qe() {
	return _.useContext(Ke);
}
var Je = _.createContext({ isTransitioning: !1 });
Je.displayName = "ViewTransition";
var Ye = _.createContext(/* @__PURE__ */ new Map());
Ye.displayName = "Fetchers";
var Xe = _.createContext(null);
Xe.displayName = "Await";
var Ze = _.createContext(null);
Ze.displayName = "Navigation";
var Qe = _.createContext(null);
Qe.displayName = "Location";
var $e = _.createContext({
	outlet: null,
	matches: [],
	isDataRoute: !1
});
$e.displayName = "Route";
var et = _.createContext(null);
et.displayName = "RouteError";
var tt = "REACT_ROUTER_ERROR", nt = "REDIRECT", rt = "ROUTE_ERROR_RESPONSE";
function it(e) {
	if (e.startsWith(`${tt}:${nt}:{`)) try {
		let t = JSON.parse(e.slice(28));
		if (typeof t == "object" && t && typeof t.status == "number" && typeof t.statusText == "string" && typeof t.location == "string" && typeof t.reloadDocument == "boolean" && typeof t.replace == "boolean") return t;
	} catch {}
}
function at(e) {
	if (e.startsWith(`${tt}:${rt}:{`)) try {
		let t = JSON.parse(e.slice(40));
		if (typeof t == "object" && t && typeof t.status == "number" && typeof t.statusText == "string") return new Ae(t.status, t.statusText, t.data);
	} catch {}
}
function ot(e, { relative: t } = {}) {
	C(st(), "useHref() may be used only in the context of a <Router> component.");
	let { basename: n, navigator: r } = _.useContext(Ze), { hash: i, pathname: a, search: o } = pt(e, { relative: t }), s = a;
	return n !== "/" && (s = a === "/" ? n : A([n, a])), r.createHref({
		pathname: s,
		search: o,
		hash: i
	});
}
function st() {
	return _.useContext(Qe) != null;
}
function ct() {
	return C(st(), "useLocation() may be used only in the context of a <Router> component."), _.useContext(Qe).location;
}
var lt = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
function ut(e) {
	_.useContext(Ze).static || _.useLayoutEffect(e);
}
function dt() {
	let { isDataRoute: e } = _.useContext($e);
	return e ? kt() : ft();
}
function ft() {
	C(st(), "useNavigate() may be used only in the context of a <Router> component.");
	let e = _.useContext(We), { basename: t, navigator: n } = _.useContext(Ze), { matches: r } = _.useContext($e), { pathname: i } = ct(), a = JSON.stringify(we(r)), o = _.useRef(!1);
	return ut(() => {
		o.current = !0;
	}), _.useCallback((r, s = {}) => {
		if (w(o.current, lt), !o.current) return;
		if (typeof r == "number") {
			n.go(r);
			return;
		}
		let c = Te(r, JSON.parse(a), i, s.relative === "path");
		e == null && t !== "/" && (c.pathname = c.pathname === "/" ? t : A([t, c.pathname])), ze(typeof r == "string" ? r : D(r), n.createHref(c), Ie(n), "reject"), (s.replace ? n.replace : n.push)(c, s.state, s);
	}, [
		t,
		n,
		a,
		i,
		e
	]);
}
_.createContext(null);
function pt(e, { relative: t } = {}) {
	let { matches: n } = _.useContext($e), { pathname: r } = ct(), i = JSON.stringify(we(n));
	return _.useMemo(() => Te(e, JSON.parse(i), r, t === "path"), [
		e,
		i,
		r,
		t
	]);
}
function mt(e, t, n) {
	C(st(), "useRoutes() may be used only in the context of a <Router> component.");
	let { navigator: r } = _.useContext(Ze), { matches: i } = _.useContext($e), a = i[i.length - 1], o = a ? a.params : {}, s = a ? a.pathname : "/", c = a ? a.pathnameBase : "/", l = a && a.route;
	{
		let e = l && l.path || "";
		jt(s, !l || e.endsWith("*") || e.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${s}" (under <Route path="${e}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${e}"> to <Route path="${e === "/" ? "*" : `${e}/*`}">.`);
	}
	let u = ct(), d;
	if (t) {
		let e = typeof t == "string" ? ee(t) : t;
		C(c === "/" || e.pathname?.startsWith(c), `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${c}" but pathname "${e.pathname}" was given in the \`location\` prop.`), d = e;
	} else d = u;
	let f = d.pathname || "/", p = f;
	if (c !== "/") {
		let e = c.replace(/^\//, "").split("/");
		p = "/" + f.replace(/^\//, "").split("/").slice(e.length).join("/");
	}
	let m = n && n.state.matches.length ? n.state.matches.map((e) => Object.assign(e, { route: n.manifest[e.route.id] || e.route })) : te(e, { pathname: p });
	w(l || m != null, `No routes matched location "${d.pathname}${d.search}${d.hash}" `), w(m == null || m[m.length - 1].route.element !== void 0 || m[m.length - 1].route.Component !== void 0 || m[m.length - 1].route.lazy !== void 0, `Matched leaf route at location "${d.pathname}${d.search}${d.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);
	let h = xt(m && m.map((e) => Object.assign({}, e, {
		params: Object.assign({}, o, e.params),
		pathname: A([c, r.encodeLocation ? r.encodeLocation(e.pathname.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : e.pathname]),
		pathnameBase: e.pathnameBase === "/" ? c : A([c, r.encodeLocation ? r.encodeLocation(e.pathnameBase.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : e.pathnameBase])
	})), i, n);
	return t && h ? /* @__PURE__ */ _.createElement(Qe.Provider, { value: {
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
function ht() {
	let e = Ot(), t = je(e) ? `${e.status} ${e.statusText}` : e instanceof Error ? e.message : JSON.stringify(e), n = e instanceof Error ? e.stack : null, r = "rgba(200,200,200, 0.5)", i = {
		padding: "0.5rem",
		backgroundColor: r
	}, a = {
		padding: "2px 4px",
		backgroundColor: r
	}, o = null;
	return console.error("Error handled by React Router default ErrorBoundary:", e), o = /* @__PURE__ */ _.createElement(_.Fragment, null, /* @__PURE__ */ _.createElement("p", null, "💿 Hey developer 👋"), /* @__PURE__ */ _.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */ _.createElement("code", { style: a }, "ErrorBoundary"), " or", " ", /* @__PURE__ */ _.createElement("code", { style: a }, "errorElement"), " prop on your route.")), /* @__PURE__ */ _.createElement(_.Fragment, null, /* @__PURE__ */ _.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ _.createElement("h3", { style: { fontStyle: "italic" } }, t), n ? /* @__PURE__ */ _.createElement("pre", { style: i }, n) : null, o);
}
var gt = /* @__PURE__ */ _.createElement(ht, null), _t = class extends _.Component {
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
			let t = at(e.digest);
			t && (e = t);
		}
		let t = e === void 0 ? this.props.children : /* @__PURE__ */ _.createElement($e.Provider, { value: this.props.routeContext }, /* @__PURE__ */ _.createElement(et.Provider, {
			value: e,
			children: this.props.component
		}));
		return this.context ? /* @__PURE__ */ _.createElement(yt, { error: e }, t) : t;
	}
};
_t.contextType = Ke;
var vt = /* @__PURE__ */ new WeakMap();
function yt({ children: e, error: t }) {
	let { basename: n, navigator: r } = _.useContext(Ze);
	if (typeof t == "object" && t && "digest" in t && typeof t.digest == "string") {
		let e = it(t.digest);
		if (e) {
			let i = vt.get(t);
			if (i) throw i;
			let a = Pe(e.location, n), o = a.absoluteURL || a.to;
			if (ze(e.location, o, Ie(r), "allow-explicit"), Ue(o)) throw Error("Invalid redirect location");
			if (Ne && !vt.get(t)) {
				if (a.isExternal || e.reloadDocument) window.location.href = o;
				else {
					let n = Promise.resolve().then(() => window.__reactRouterDataRouter.navigate(a.to, { replace: e.replace }));
					throw vt.set(t, n), n;
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
function bt({ routeContext: e, match: t, children: n }) {
	let r = _.useContext(We);
	return r && r.static && r.staticContext && (t.route.errorElement || t.route.ErrorBoundary) && (r.staticContext._deepestRenderedBoundaryId = t.route.id), /* @__PURE__ */ _.createElement($e.Provider, { value: e }, n);
}
function xt(e, t = [], n) {
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
		C(e >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(a).join(",")}`), i = i.slice(0, Math.min(i.length, e + 1));
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
			pattern: Me(r.matches),
			errorInfo: t
		});
	} : void 0;
	return i.reduceRight((e, n, c) => {
		let u, d = !1, f = null, p = null;
		r && (u = a && n.route.id ? a[n.route.id] : void 0, f = n.route.errorElement || gt, o && (s < 0 && c === 0 ? (jt("route-fallback", !1, "No `HydrateFallback` element provided to render during initial hydration"), d = !0, p = null) : s === c && (d = !0, p = n.route.hydrateFallbackElement || null)));
		let m = t.concat(i.slice(0, c + 1)), h = () => {
			let t;
			return t = u ? f : d ? p : n.route.Component ? /* @__PURE__ */ _.createElement(n.route.Component, null) : n.route.element ? n.route.element : e, /* @__PURE__ */ _.createElement(bt, {
				match: n,
				routeContext: {
					outlet: e,
					matches: m,
					isDataRoute: r != null
				},
				children: t
			});
		};
		return r && (n.route.ErrorBoundary || n.route.errorElement || c === 0) ? /* @__PURE__ */ _.createElement(_t, {
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
function St(e) {
	return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function Ct(e) {
	let t = _.useContext(We);
	return C(t, St(e)), t;
}
function wt(e) {
	let t = _.useContext(Ge);
	return C(t, St(e)), t;
}
function Tt(e) {
	let t = _.useContext($e);
	return C(t, St(e)), t;
}
function Et(e) {
	let t = Tt(e), n = t.matches[t.matches.length - 1];
	return C(n.route.id, `${e} can only be used on routes that contain a unique "id"`), n.route.id;
}
function Dt() {
	return Et("useRouteId");
}
function Ot() {
	let e = _.useContext(et), t = wt("useRouteError"), n = Et("useRouteError");
	return e === void 0 ? t.errors?.[n] : e;
}
function kt() {
	let { router: e } = Ct("useNavigate"), t = Et("useNavigate"), n = _.useRef(!1);
	return ut(() => {
		n.current = !0;
	}), _.useCallback(async (r, i = {}) => {
		w(n.current, lt), n.current && (typeof r == "number" ? await e.navigate(r) : await e.navigate(r, {
			fromRouteId: t,
			...i
		}));
	}, [e, t]);
}
var At = {};
function jt(e, t, n) {
	!t && !At[e] && (At[e] = !0, w(!1, n));
}
_.memo(Mt);
function Mt({ routes: e, manifest: t, future: n, state: r, isStatic: i, onError: a }) {
	return mt(e, void 0, {
		manifest: t,
		state: r,
		isStatic: i,
		onError: a,
		future: n
	});
}
function Nt({ basename: e, children: t, initialEntries: n, initialIndex: r, useTransitions: i }) {
	let a = _.useRef();
	a.current ??= S({
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
	return _.useLayoutEffect(() => o.listen(l), [o, l]), /* @__PURE__ */ _.createElement(Pt, {
		basename: e,
		children: t,
		location: s.location,
		navigationType: s.action,
		navigator: o,
		useTransitions: i
	});
}
function Pt({ basename: e = "/", children: t = null, location: n, navigationType: r = "POP", navigator: i, static: a = !1, useTransitions: o }) {
	C(!st(), "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");
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
	typeof n == "string" && (n = ee(n));
	let { pathname: l = "/", search: u = "", hash: d = "", state: f = null, key: p = "default", mask: m } = n, h = _.useMemo(() => {
		let e = xe(l, s);
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
	return w(h != null, `<Router basename="${s}"> is not able to match the URL "${l}${u}${d}" because it does not start with the basename, so the <Router> won't render anything.`), h == null ? null : /* @__PURE__ */ _.createElement(Ze.Provider, { value: c }, /* @__PURE__ */ _.createElement(Qe.Provider, {
		children: t,
		value: h
	}));
}
_.Component;
var Ft = "get", It = "application/x-www-form-urlencoded";
function Lt(e) {
	return typeof HTMLElement < "u" && e instanceof HTMLElement;
}
function Rt(e) {
	return Lt(e) && e.tagName.toLowerCase() === "button";
}
function zt(e) {
	return Lt(e) && e.tagName.toLowerCase() === "form";
}
function Bt(e) {
	return Lt(e) && e.tagName.toLowerCase() === "input";
}
function Vt(e) {
	return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function Ht(e, t) {
	return e.button === 0 && (!t || t === "_self") && !Vt(e);
}
function Ut(e = "") {
	return new URLSearchParams(typeof e == "string" || Array.isArray(e) || e instanceof URLSearchParams ? e : Object.keys(e).reduce((t, n) => {
		let r = e[n];
		return t.concat(Array.isArray(r) ? r.map((e) => [n, e]) : [[n, r]]);
	}, []));
}
function Wt(e, t) {
	let n = Ut(e);
	return t && t.forEach((e, r) => {
		n.has(r) || t.getAll(r).forEach((e) => {
			n.append(r, e);
		});
	}), n;
}
var Gt = null;
function Kt() {
	if (Gt === null) try {
		new FormData(document.createElement("form"), 0), Gt = !1;
	} catch {
		Gt = !0;
	}
	return Gt;
}
var qt = /* @__PURE__ */ new Set([
	"application/x-www-form-urlencoded",
	"multipart/form-data",
	"text/plain"
]);
function Jt(e) {
	return e != null && !qt.has(e) ? (w(!1, `"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${It}"`), null) : e;
}
function Yt(e, t) {
	let n, r, i, a, o;
	if (zt(e)) {
		let o = e.getAttribute("action");
		r = o ? xe(o, t) : null, n = e.getAttribute("method") || Ft, i = Jt(e.getAttribute("enctype")) || It, a = new FormData(e);
	} else if (Rt(e) || Bt(e) && (e.type === "submit" || e.type === "image")) {
		let o = e.form;
		if (o == null) throw Error("Cannot submit a <button> or <input type=\"submit\"> without a <form>");
		let s = e.getAttribute("formaction") || o.getAttribute("action");
		if (r = s ? xe(s, t) : null, n = e.getAttribute("formmethod") || o.getAttribute("method") || Ft, i = Jt(e.getAttribute("formenctype")) || Jt(o.getAttribute("enctype")) || It, a = new FormData(o, e), !Kt()) {
			let { name: t, type: n, value: r } = e;
			if (n === "image") {
				let e = t ? `${t}.` : "";
				a.append(`${e}x`, "0"), a.append(`${e}y`, "0");
			} else t && a.append(t, r);
		}
	} else if (Lt(e)) throw Error("Cannot submit element that is not <form>, <button>, or <input type=\"submit|image\">");
	else n = Ft, r = null, i = It, o = e;
	return a && i === "text/plain" && (o = a, a = void 0), {
		action: r,
		method: n.toLowerCase(),
		encType: i,
		formData: a,
		body: o
	};
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function Xt(e, t) {
	if (e === !1 || e == null) throw Error(t);
}
function Zt(e, t, n, r) {
	let i = typeof e == "string" ? new URL(e, typeof window > "u" ? "server://singlefetch/" : window.location.origin) : e;
	return i.pathname = n ? i.pathname.endsWith("/") ? `${i.pathname}_.${r}` : `${i.pathname}.${r}` : i.pathname === "/" ? `_root.${r}` : t && xe(i.pathname, t) === "/" ? `${j(t)}/_root.${r}` : `${j(i.pathname)}.${r}`, i;
}
async function Qt(e, t) {
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
function M(e) {
	return e != null && typeof e.page == "string";
}
function $t(e) {
	return e == null ? !1 : e.href == null ? e.rel === "preload" && typeof e.imageSrcSet == "string" && typeof e.imageSizes == "string" : typeof e.rel == "string" && typeof e.href == "string";
}
async function en(e, t, n) {
	return on((await Promise.all(e.map(async (e) => {
		let r = t.routes[e.route.id];
		if (r) {
			let e = await Qt(r, n);
			return e.links ? e.links() : [];
		}
		return [];
	}))).flat(1).filter($t).filter((e) => e.rel === "stylesheet" || e.rel === "preload").map((e) => e.rel === "stylesheet" ? {
		...e,
		rel: "prefetch",
		as: "style"
	} : {
		...e,
		rel: "prefetch"
	}));
}
function tn(e, t, n, r, i, a) {
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
function nn(e, t, { includeHydrateFallback: n } = {}) {
	return rn(e.map((e) => {
		let r = t.routes[e.route.id];
		if (!r) return [];
		let i = [r.module];
		return r.clientActionModule && (i = i.concat(r.clientActionModule)), r.clientLoaderModule && (i = i.concat(r.clientLoaderModule)), n && r.hydrateFallbackModule && (i = i.concat(r.hydrateFallbackModule)), r.imports && (i = i.concat(r.imports)), i;
	}).flat(1));
}
function rn(e) {
	return [...new Set(e)];
}
function an(e) {
	let t = {}, n = Object.keys(e).sort();
	for (let r of n) t[r] = e[r];
	return t;
}
function on(e, t) {
	let n = /* @__PURE__ */ new Set(), r = new Set(t);
	return e.reduce((e, i) => {
		if (t && !M(i) && i.as === "script" && i.href && r.has(i.href)) return e;
		let a = JSON.stringify(an(i));
		return n.has(a) || (n.add(a), e.push({
			key: a,
			link: i
		})), e;
	}, []);
}
function sn() {
	let e = _.useContext(We);
	return Xt(e, "You must render this element inside a <DataRouterContext.Provider> element"), e;
}
function cn() {
	let e = _.useContext(Ge);
	return Xt(e, "You must render this element inside a <DataRouterStateContext.Provider> element"), e;
}
var ln = _.createContext(void 0);
ln.displayName = "FrameworkContext";
function un() {
	let e = _.useContext(ln);
	return Xt(e, "You must render this element inside a <HydratedRouter> element"), e;
}
function dn(e, t) {
	let n = _.useContext(ln), [r, i] = _.useState(!1), [a, o] = _.useState(!1), { onFocus: s, onBlur: c, onMouseEnter: l, onMouseLeave: u, onTouchStart: d } = t, f = _.useRef(null);
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
			onFocus: fn(s, p),
			onBlur: fn(c, m),
			onMouseEnter: fn(l, p),
			onMouseLeave: fn(u, m),
			onTouchStart: fn(d, p)
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
function fn(e, t) {
	return (n) => {
		e && e(n), n.defaultPrevented || t(n);
	};
}
function pn({ page: e, ...t }) {
	let n = qe(), { nonce: r } = un(), { router: i } = sn(), a = _.useMemo(() => te(i.routes, e, i.basename), [
		i.routes,
		e,
		i.basename
	]);
	return a ? (t.nonce == null && r && (t = {
		...t,
		nonce: r
	}), n ? /* @__PURE__ */ _.createElement(hn, {
		page: e,
		matches: a,
		...t
	}) : /* @__PURE__ */ _.createElement(gn, {
		page: e,
		matches: a,
		...t
	})) : null;
}
function mn(e) {
	let { manifest: t, routeModules: n } = un(), [r, i] = _.useState([]);
	return _.useEffect(() => {
		let r = !1;
		return en(e, t, n).then((e) => {
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
function hn({ page: e, matches: t, ...n }) {
	let r = ct(), { future: i } = un(), { basename: a } = sn(), o = _.useMemo(() => {
		if (e === r.pathname + r.search + r.hash) return [];
		let n = Zt(e, a, i.v8_trailingSlashAwareDataRequests, "rsc"), o = !1, s = [];
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
function gn({ page: e, matches: t, ...n }) {
	let r = ct(), { future: i, manifest: a, routeModules: o } = un(), { basename: s } = sn(), { loaderData: c, matches: l } = cn(), u = _.useMemo(() => tn(e, t, l, a, r, "data"), [
		e,
		t,
		l,
		a,
		r
	]), d = _.useMemo(() => tn(e, t, l, a, r, "assets"), [
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
		let d = Zt(e, s, i.v8_trailingSlashAwareDataRequests, "data");
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
	]), p = _.useMemo(() => nn(d, a), [d, a]), m = mn(d);
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
function _n(...e) {
	return (t) => {
		e.forEach((e) => {
			typeof e == "function" ? e(t) : e != null && (e.current = t);
		});
	};
}
_.Component;
var vn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0;
try {
	vn && (window.__reactRouterVersion = "7.18.4");
} catch {}
var yn = _.forwardRef(function({ onClick: e, discover: t = "render", prefetch: n = "none", relative: r, reloadDocument: i, replace: a, mask: o, state: s, target: c, to: l, preventScrollReset: u, viewTransition: d, defaultShouldRevalidate: f, ...p }, m) {
	let { basename: h, navigator: g, useTransitions: y } = _.useContext(Ze), b = typeof l == "string" && v.test(l), x = Pe(l, h);
	l = x.to;
	let S = ot(l, { relative: r }), C = ct(), w = null;
	if (o) {
		let e = Te(o, [], C.mask ? C.mask.pathname : "/", !0);
		h !== "/" && (e.pathname = e.pathname === "/" ? h : A([h, e.pathname])), w = g.createHref(e);
	}
	let [T, E, D] = dn(n, p), ee = wn(l, {
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
	function te(t) {
		e && e(t), t.defaultPrevented || ee(t);
	}
	let ne = !(x.isExternal || i), re = /* @__PURE__ */ _.createElement("a", {
		...p,
		...D,
		href: (ne ? w : void 0) || x.absoluteURL || S,
		onClick: ne ? te : e,
		ref: _n(m, E),
		target: c,
		"data-discover": !b && t === "render" ? "true" : void 0
	});
	return T && !b ? /* @__PURE__ */ _.createElement(_.Fragment, null, re, /* @__PURE__ */ _.createElement(pn, { page: S })) : re;
});
yn.displayName = "Link";
var bn = _.forwardRef(function({ "aria-current": e = "page", caseSensitive: t = !1, className: n = "", end: r = !1, style: i, to: a, viewTransition: o, children: s, ...c }, l) {
	let u = pt(a, { relative: c.relative }), d = ct(), f = _.useContext(Ge), { navigator: p, basename: m } = _.useContext(Ze), h = f != null && An(u) && o === !0, g = p.encodeLocation ? p.encodeLocation(u).pathname : u.pathname, v = d.pathname, y = f && f.navigation && f.navigation.location ? f.navigation.location.pathname : null;
	t || (v = v.toLowerCase(), y = y ? y.toLowerCase() : null, g = g.toLowerCase()), y && m && (y = xe(y, m) || y);
	let b = g !== "/" && g.endsWith("/") ? g.length - 1 : g.length, x = v === g || !r && v.startsWith(g) && v.charAt(b) === "/", S = y != null && (y === g || !r && y.startsWith(g) && y.charAt(g.length) === "/"), C = {
		isActive: x,
		isPending: S,
		isTransitioning: h
	}, w = x ? e : void 0, T;
	T = typeof n == "function" ? n(C) : [
		n,
		x ? "active" : null,
		S ? "pending" : null,
		h ? "transitioning" : null
	].filter(Boolean).join(" ");
	let E = typeof i == "function" ? i(C) : i;
	return /* @__PURE__ */ _.createElement(yn, {
		...c,
		"aria-current": w,
		className: T,
		ref: l,
		style: E,
		to: a,
		viewTransition: o
	}, typeof s == "function" ? s(C) : s);
});
bn.displayName = "NavLink";
var xn = _.forwardRef(({ discover: e = "render", fetcherKey: t, navigate: n, reloadDocument: r, replace: i, state: a, method: o = Ft, action: s, onSubmit: c, relative: l, preventScrollReset: u, viewTransition: d, defaultShouldRevalidate: f, ...p }, m) => {
	let { useTransitions: h } = _.useContext(Ze), g = On(), y = kn(s, { relative: l }), b = o.toLowerCase() === "get" ? "get" : "post", x = typeof s == "string" && v.test(s);
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
		"data-discover": !x && e === "render" ? "true" : void 0
	});
});
xn.displayName = "Form";
function Sn(e) {
	return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function Cn(e) {
	let t = _.useContext(We);
	return C(t, Sn(e)), t;
}
function wn(e, { target: t, replace: n, mask: r, state: i, preventScrollReset: a, relative: o, viewTransition: s, defaultShouldRevalidate: c, useTransitions: l } = {}) {
	let u = dt(), d = ct(), f = pt(e, { relative: o });
	return _.useCallback((p) => {
		if (Ht(p, t)) {
			p.preventDefault();
			let t = n === void 0 ? D(d) === D(f) : n, m = () => u(e, {
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
function Tn(e) {
	w(typeof URLSearchParams < "u", "You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.");
	let t = _.useRef(Ut(e)), n = _.useRef(!1), r = ct(), i = _.useMemo(() => Wt(r.search, n.current ? null : t.current), [r.search]), a = dt();
	return [i, _.useCallback((e, t) => {
		let r = Ut(typeof e == "function" ? e(new URLSearchParams(i)) : e);
		n.current = !0, a("?" + r, t);
	}, [a, i])];
}
var En = 0, Dn = () => `__${String(++En)}__`;
function On() {
	let { router: e } = Cn("useSubmit"), { basename: t } = _.useContext(Ze), n = Dt(), r = e.fetch, i = e.navigate;
	return _.useCallback(async (e, a = {}) => {
		let { action: o, method: s, encType: c, formData: l, body: u } = Yt(e, t);
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
	let { basename: n } = _.useContext(Ze), r = _.useContext($e);
	C(r, "useFormAction must be used inside a RouteContext");
	let [i] = r.matches.slice(-1), a = { ...pt(e || ".", { relative: t }) }, o = ct();
	if (e == null) {
		a.search = o.search;
		let e = new URLSearchParams(a.search), t = e.getAll("index");
		if (t.some((e) => e === "")) {
			e.delete("index"), t.filter((e) => e).forEach((t) => e.append("index", t));
			let n = e.toString();
			a.search = n ? `?${n}` : "";
		}
	}
	return (!e || e === ".") && i.route.index && (a.search = a.search ? a.search.replace(/^\?/, "?index&") : "?index"), n !== "/" && (a.pathname = a.pathname === "/" ? n : A([n, a.pathname])), D(a);
}
function An(e, { relative: t } = {}) {
	let n = _.useContext(Je);
	C(n != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
	let { basename: r } = Cn("useViewTransitionState"), i = pt(e, { relative: t });
	if (!n.isTransitioning) return !1;
	let a = xe(n.currentLocation.pathname, r) || n.currentLocation.pathname, o = xe(n.nextLocation.pathname, r) || n.nextLocation.pathname;
	return _e(i.pathname, o) != null || _e(i.pathname, a) != null;
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
function N(e) {
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
function P(e, t, n) {
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
function F(e, t, n, r) {
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
}, $r = F("$ZodError", Qr);
F("$ZodError", Qr, void 0, { Parent: Error });
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
var Yi = /^[\s\S]{0,}$/, Xi = /^-?\d+(?:\.\d+)?$/, Zi = /^(?:true|false)$/i, Qi = /^[^A-Z]*$/, $i = /^[^a-z]*$/, ea = /*@__PURE__*/ F("$ZodCheck", (e, t) => {
	var n;
	e._zod ??= {}, e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), ta = (e) => {
	let t = e.value;
	return !In(t) && t.length !== void 0;
}, na = {
	number: "number",
	bigint: "bigint",
	object: "date"
}, ra = /*@__PURE__*/ F("$ZodCheckLessThan", (e, t) => {
	ea.init(e, t);
	let n = na[typeof t.value];
	e._zod.check = (r) => {
		(t.inclusive ? r.value <= t.value : r.value < t.value) || r.issues.push({
			origin: na[typeof r.value] ?? n,
			code: "too_big",
			maximum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), ia = /*@__PURE__*/ F("$ZodCheckGreaterThan", (e, t) => {
	ea.init(e, t);
	let n = na[typeof t.value];
	e._zod.check = (r) => {
		(t.inclusive ? r.value >= t.value : r.value > t.value) || r.issues.push({
			origin: na[typeof r.value] ?? n,
			code: "too_small",
			minimum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), aa = /*@__PURE__*/ F("$ZodCheckMultipleOf", (e, t) => {
	ea.init(e, t), e._zod.check = (n) => {
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
}), oa = /*@__PURE__*/ F("$ZodCheckNumberFormat", (e, t) => {
	ea.init(e, t), t.format = t.format || "float64";
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
}), sa = /*@__PURE__*/ F("$ZodCheckMaxLength", (e, t) => {
	var n;
	ea.init(e, t), (n = e._zod.def).when ?? (n.when = ta), e._zod.check = (n) => {
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
}), ca = /*@__PURE__*/ F("$ZodCheckMinLength", (e, t) => {
	var n;
	ea.init(e, t), (n = e._zod.def).when ?? (n.when = ta), e._zod.check = (n) => {
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
}), I = /*@__PURE__*/ F("$ZodCheckLengthEquals", (e, t) => {
	var n;
	ea.init(e, t), (n = e._zod.def).when ?? (n.when = ta), e._zod.check = (n) => {
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
}), la = /*@__PURE__*/ F("$ZodCheckStringFormat", (e, t) => {
	var n, r;
	ea.init(e, t), t.pattern ? (n = e._zod).check ?? (n.check = (n) => {
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
}), ua = /*@__PURE__*/ F("$ZodCheckRegex", (e, t) => {
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
}), da = /*@__PURE__*/ F("$ZodCheckLowerCase", (e, t) => {
	t.pattern ??= Qi, la.init(e, t);
}), fa = /*@__PURE__*/ F("$ZodCheckUpperCase", (e, t) => {
	t.pattern ??= $i, la.init(e, t);
}), pa = /*@__PURE__*/ F("$ZodCheckIncludes", (e, t) => {
	ea.init(e, t);
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
}), ma = /*@__PURE__*/ F("$ZodCheckStartsWith", (e, t) => {
	ea.init(e, t);
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
}), ha = /*@__PURE__*/ F("$ZodCheckEndsWith", (e, t) => {
	ea.init(e, t);
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
}), ga = /*@__PURE__*/ F("$ZodCheckOverwrite", (e, t) => {
	ea.init(e, t), e._zod.check = (e) => {
		e.value = t.tx(e.value);
	};
}), _a = class {
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
}, va = {
	major: 4,
	minor: 6,
	patch: 5
}, ya = /*@__PURE__*/ F("$ZodType", (e, t) => {
	var n;
	e ??= {}, e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = va;
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
		return kr(this, "~standard", Sa(this));
	},
	set "~standard"(e) {
		Or(this, "~standard", e);
	}
}), ba = (e, t) => e.issues.length ? { issues: e.issues.map((e) => xr(e, t, Kr())) } : { value: e.value };
async function xa(e, t) {
	let n = { async: !0 };
	return ba(await e._zod.run({
		value: t,
		issues: []
	}, n), n);
}
function Sa(e) {
	return {
		validate: (t) => {
			let n = { async: !1 };
			try {
				let r = e._zod.run({
					value: t,
					issues: []
				}, n);
				if (!(r instanceof Promise)) return ba(r, n);
			} catch {}
			return xa(e, t);
		},
		vendor: "zod",
		version: 1
	};
}
var Ca = /*@__PURE__*/ F("$ZodString", (e, t) => {
	ya.init(e, t), e._zod.pattern = t.pattern ?? Yi, e._zod.parse = (n, r) => {
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
}), L = /*@__PURE__*/ F("$ZodStringFormat", (e, t) => {
	la.init(e, t), Ca.init(e, t);
}), wa = /*@__PURE__*/ F("$ZodGUID", (e, t) => {
	t.pattern ??= Ai, L.init(e, t);
}), Ta = /*@__PURE__*/ F("$ZodUUID", (e, t) => {
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
}), Ea = /*@__PURE__*/ F("$ZodEmail", (e, t) => {
	t.pattern ??= Mi, L.init(e, t);
});
function Da(e) {
	try {
		return typeof URL < "u" && typeof URL.canParse == "function" ? URL.canParse(e) : (new URL(e), !0);
	} catch {
		return !1;
	}
}
function Oa(e, t) {
	return !("normalize" in t) && !("hostname" in t) && !("protocol" in t) ? Da(e) || 2 : ka(e, t);
}
function ka(e, t) {
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
var Aa = /[\t\n\r]/g;
function ja(e) {
	return e.replace(Aa, "");
}
function Ma(e, t) {
	return t.lastIndex = 0, t.test(e.hostname);
}
function Na(e, t) {
	return t.lastIndex = 0, t.test(e.protocol.endsWith(":") ? e.protocol.slice(0, -1) : e.protocol);
}
var Pa = /*@__PURE__*/ F("$ZodURL", (e, t) => {
	L.init(e, t), e._zod.check = (n) => {
		try {
			let r = n.value.trim(), i = Oa(r, t);
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
				n.value = ja(r);
				return;
			}
			t.hostname && !Ma(i, t.hostname) && n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: t.hostname.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			}), t.protocol && !Na(i, t.protocol) && n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: t.protocol.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			}), n.value = t.normalize ? i.href : ja(r);
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
}), Fa = /*@__PURE__*/ F("$ZodEmoji", (e, t) => {
	t.pattern ??= Pi(), L.init(e, t);
}), Ia = /*@__PURE__*/ F("$ZodNanoID", (e, t) => {
	if (t.length !== void 0 && (!Number.isInteger(t.length) || t.length < 1)) throw Error(`Invalid nanoid length: ${t.length}`);
	t.pattern ??= t.length === void 0 ? Di : Oi(t.length), L.init(e, t);
}), La = /*@__PURE__*/ F("$ZodCUID", (e, t) => {
	t.pattern ??= Si, L.init(e, t);
}), Ra = /*@__PURE__*/ F("$ZodCUID2", (e, t) => {
	t.pattern ??= Ci, L.init(e, t);
}), za = /*@__PURE__*/ F("$ZodULID", (e, t) => {
	t.pattern ??= wi, L.init(e, t);
}), Ba = /*@__PURE__*/ F("$ZodXID", (e, t) => {
	t.pattern ??= Ti, L.init(e, t);
}), Va = /*@__PURE__*/ F("$ZodKSUID", (e, t) => {
	t.pattern ??= Ei, L.init(e, t);
}), Ha = /*@__PURE__*/ F("$ZodISODateTime", (e, t) => {
	t.pattern ??= Ji(t), L.init(e, t);
}), Ua = /*@__PURE__*/ F("$ZodISODate", (e, t) => {
	t.pattern ??= Gi, L.init(e, t);
}), Wa = /*@__PURE__*/ F("$ZodISOTime", (e, t) => {
	t.pattern ??= qi(t), L.init(e, t);
}), Ga = /*@__PURE__*/ F("$ZodISODuration", (e, t) => {
	t.pattern ??= ki, L.init(e, t);
}), Ka = /*@__PURE__*/ F("$ZodIPv4", (e, t) => {
	t.pattern ??= Fi, L.init(e, t);
}), qa = /^[0-9a-fA-F:.]+$/;
function Ja(e) {
	return qa.test(e) ? Da(`http://[${e}]`) : !1;
}
var Ya = /*@__PURE__*/ F("$ZodIPv6", (e, t) => {
	t.pattern ??= Ii, L.init(e, t), e._zod.check = (n) => {
		Ja(n.value) || n.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Xa = /*@__PURE__*/ F("$ZodCIDRv4", (e, t) => {
	t.pattern ??= Li, L.init(e, t);
});
function Za(e) {
	let t = e.split("/");
	if (t.length !== 2) return !1;
	let [n, r] = t;
	if (!r) return !1;
	let i = Number(r);
	return `${i}` !== r || i < 0 || i > 128 ? !1 : Ja(n);
}
var Qa = /*@__PURE__*/ F("$ZodCIDRv6", (e, t) => {
	t.pattern ??= Ri, L.init(e, t), e._zod.check = (n) => {
		Za(n.value) || n.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
});
function $a(e) {
	if (e === "") return !0;
	if (/\s/.test(e) || e.length % 4 != 0) return !1;
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}
var eo = /^[0-9a-zA-Z+/]*={0,2}$/, to = /*@__PURE__*/ F("$ZodBase64", (e, t) => {
	t.pattern ??= eo, L.init(e, t), e._zod.check = (n) => {
		$a(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), no = /^[A-Za-z0-9_-]*$/;
function ro(e) {
	if (!no.test(e)) return !1;
	let t = e.replace(/[-_]/g, (e) => e === "-" ? "+" : "/");
	return $a(t.padEnd(Math.ceil(t.length / 4) * 4, "="));
}
var io = /*@__PURE__*/ F("$ZodBase64URL", (e, t) => {
	t.pattern ??= no, L.init(e, t), e._zod.check = (n) => {
		ro(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), ao = /*@__PURE__*/ F("$ZodE164", (e, t) => {
	t.pattern ??= Hi, L.init(e, t);
});
function oo(e, t = null) {
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
var so = /*@__PURE__*/ F("$ZodJWT", (e, t) => {
	L.init(e, t), e._zod.check = (n) => {
		oo(n.value, t.alg) || n.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), co = /*@__PURE__*/ F("$ZodNumber", (e, t) => {
	ya.init(e, t), e._zod.pattern = Xi, e._zod.parse = (n, r) => {
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
}), lo = /*@__PURE__*/ F("$ZodNumberFormat", (e, t) => {
	oa.init(e, t), co.init(e, t);
}), uo = /*@__PURE__*/ F("$ZodBoolean", (e, t) => {
	ya.init(e, t), e._zod.pattern = Zi, e._zod.parse = (n, r) => {
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
}), fo = /*@__PURE__*/ F("$ZodUnknown", (e, t) => {
	ya.init(e, t), e._zod.parse = (e) => e;
}), po = /*@__PURE__*/ F("$ZodNever", (e, t) => {
	ya.init(e, t), e._zod.parse = (t, n) => (t.issues.push({
		expected: "never",
		code: "invalid_type",
		input: t.value,
		inst: e
	}), t);
});
function mo(e, t, n) {
	e.issues.length && t.issues.push(...vr(n, e.issues)), t.value[n] = e.value;
}
var ho = /*@__PURE__*/ F("$ZodArray", (e, t) => {
	ya.init(e, t);
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
			if (c instanceof Promise) o.push(c.then((t) => mo(t, r, e)));
			else if (mo(c, r, e), s && c.issues.length !== 0 && gr(c)) break;
		}
		return o.length ? Promise.all(o).then(() => r) : r;
	};
});
function go(e, t, n, r, i, a) {
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
var _o = [];
function vo(e) {
	let t = Object.keys(e.shape), n = Object.getOwnPropertySymbols(e.shape), r = n.length ? n : _o, i = r.length ? [...t, ...r] : t;
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
function yo(e, t, n, r, i, a, o) {
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
		a instanceof Promise ? e.push(a.then((e) => go(e, n, i, t, d, f))) : go(a, n, i, t, d, f);
	}
	return s.length && n.issues.push({
		code: "unrecognized_keys",
		keys: s,
		input: t,
		inst: a,
		continue: !0
	}), e.length ? Promise.all(e).then(() => n) : n;
}
var bo = /*@__PURE__*/ F("$ZodObject", (e, t) => {
	ya.init(e, t);
	let n = Object.getOwnPropertyDescriptor(t, "shape"), r = n?.get ? n.get.raw : t.shape ?? {};
	if (r) {
		let e = () => {
			let n = { ...r };
			return Object.defineProperty(t, "shape", { value: n }), e.raw = n, n;
		};
		e.raw = r, Object.defineProperty(t, "shape", { get: e });
	}
	let i = Fn(() => vo(t));
	P(e, "propValues", (e) => {
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
			s instanceof Promise ? l.push(s.then((n) => go(n, t, e, r, a, o))) : go(s, t, e, r, a, o);
		}
		return o ? yo(l, r, t, n, i.value, e, d === !0) : l.length ? Promise.all(l).then(() => t) : t;
	};
}), xo = /*@__PURE__*/ F("$ZodObjectJIT", (e, t) => {
	bo.init(e, t);
	let n = e._zod.parse, r = Fn(() => vo(t)), i = Gr.memoizer, a = (t) => {
		let n = r.value, a = n.symbolKeys, o = new _a(["payload", "ctx"], {
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
		return s(p) ? c && l && f?.async === !1 && f.jitless !== !0 ? (o ||= a(t.shape), i = o(i, f), u ? yo([], p, i, f, d, e, f?.abortEarly === !0) : i) : n(i, f) : (i.issues.push({
			expected: "object",
			code: "invalid_type",
			input: p,
			inst: e
		}), i);
	};
});
function So(e, t, n, r) {
	for (let n of e) if (n.issues.length === 0) return t.value = n.value, t;
	let i = e.filter((e) => !gr(e));
	return i.length === 1 ? (t.value = i[0].value, i[0]) : (t.issues.push({
		code: "invalid_union",
		input: t.value,
		inst: n,
		errors: e.map((e) => e.issues.map((e) => xr(e, r, Kr())))
	}), t);
}
var Co = /*@__PURE__*/ F("$ZodUnion", (e, t) => {
	ya.init(e, t), P(e, "optin", (e) => e.def.options.some((e) => e._zod.optin === "defaulted") ? "defaulted" : e.def.options.some((e) => e._zod.optin !== void 0) ? "optional" : void 0), P(e, "optout", (e) => e.def.options.some((e) => e._zod.optout === "optional") ? "optional" : void 0), P(e, "values", (e) => {
		if (e.def.options.every((e) => e._zod.values)) return new Set(e.def.options.flatMap((e) => Array.from(e._zod.values)));
	}), P(e, "pattern", (e) => {
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
		return a ? Promise.all(o).then((t) => So(t, r, e, i)) : So(o, r, e, i);
	};
});
function wo(e) {
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
var To = /*@__PURE__*/ F("$ZodDiscriminatedUnion", (e, t) => {
	t.inclusive = !1, Co.init(e, t);
	let n = e._zod.parse;
	P(e, "propValues", (e) => {
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
	let r = Fn(() => wo(t));
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
}), Eo = /*@__PURE__*/ F("$ZodIntersection", (e, t) => {
	ya.init(e, t), e._zod.parse = (e, n) => {
		let r = e.value, i = t.left._zod.run({
			value: r,
			issues: []
		}, n), a = t.right._zod.run({
			value: r,
			issues: []
		}, n);
		return i instanceof Promise || a instanceof Promise ? Promise.all([i, a]).then(([t, n]) => Oo(e, t, n)) : Oo(e, i, a);
	};
});
function Do(e, t) {
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
			let r = Do(e[n], t[n]);
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
			let i = e[r], a = t[r], o = Do(i, a);
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
function Oo(e, t, n) {
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
	let c = Do(t.value, n.value);
	if (!c.valid) {
		if (gr(e)) return e;
		throw Error(`Unmergable intersection. Error path: ${JSON.stringify(c.mergeErrorPath)}`);
	}
	return e.value = c.data, e;
}
var ko = /*@__PURE__*/ F("$ZodEnum", (e, t) => {
	ya.init(e, t);
	let n = jn(t.entries), r = new Set(n);
	e._zod.values = r, P(e, "pattern", (e) => {
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
}), Ao = /*@__PURE__*/ F("$ZodLiteral", (e, t) => {
	ya.init(e, t);
	let n = new Set(t.values);
	e._zod.values = n, P(e, "pattern", (e) => {
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
}), jo = /*@__PURE__*/ F("$ZodTransform", (e, t) => {
	ya.init(e, t), e._zod.optin = "optional", Gr.memoizer?.guard(e), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new Wr(e.constructor.name);
		let i = t.transform(n.value, n);
		if (r.async) return (i instanceof Promise ? i : Promise.resolve(i)).then((e) => (n.value = e, n));
		if (i instanceof Promise) throw new Ur();
		return n.value = i, n;
	};
});
function Mo(e, t) {
	return e.value = t.issues.length ? void 0 : t.value, e;
}
var No = /*@__PURE__*/ F("$ZodOptional", (e, t) => {
	ya.init(e, t), P(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), e._zod.optout = "optional", P(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? /* @__PURE__ */ new Set([...t, void 0]) : void 0;
	}), P(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${Ln(t.source)})?$`) : void 0;
	}), e._zod.parse = (e, n) => {
		if (e.value === void 0) {
			if (t.innerType._zod.optin !== "defaulted") return e;
			let r = t.innerType._zod.run({
				value: e.value,
				issues: []
			}, n);
			return r instanceof Promise ? r.then((t) => Mo(e, t)) : Mo(e, r);
		}
		return t.innerType._zod.run(e, n);
	};
}), Po = /*@__PURE__*/ F("$ZodExactOptional", (e, t) => {
	No.init(e, t), P(e, "values", (e) => e.def.innerType._zod.values), P(e, "pattern", (e) => e.def.innerType._zod.pattern), e._zod.parse = (e, n) => t.innerType._zod.run(e, n);
}), Fo = /*@__PURE__*/ F("$ZodNullable", (e, t) => {
	ya.init(e, t), P(e, "optin", (e) => e.def.innerType._zod.optin), P(e, "optout", (e) => e.def.innerType._zod.optout), P(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${Ln(t.source)}|null)$`) : void 0;
	}), P(e, "values", (e) => e.def.innerType._zod.values ? /* @__PURE__ */ new Set([...e.def.innerType._zod.values, null]) : void 0), e._zod.parse = (e, n) => e.value === null ? e : t.innerType._zod.run(e, n);
}), Io = /*@__PURE__*/ F("$ZodDefault", (e, t) => {
	ya.init(e, t), e._zod.optin = "defaulted", P(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		if (e.value === void 0) return e.value = t.defaultValue, e;
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Lo(e, t)) : Lo(r, t);
	};
});
function Lo(e, t) {
	return e.value === void 0 && (e.value = t.defaultValue), e;
}
var Ro = /*@__PURE__*/ F("$ZodPrefault", (e, t) => {
	ya.init(e, t), e._zod.optin = "defaulted", P(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => (n.direction === "backward" || e.value === void 0 && (e.value = t.defaultValue), t.innerType._zod.run(e, n));
}), zo = /*@__PURE__*/ F("$ZodNonOptional", (e, t) => {
	ya.init(e, t), P(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? new Set([...t].filter((e) => e !== void 0)) : void 0;
	}), e._zod.parse = (n, r) => {
		let i = t.innerType._zod.run(n, r);
		return i instanceof Promise ? i.then((t) => Bo(t, e)) : Bo(i, e);
	};
});
function Bo(e, t) {
	return !e.issues.length && e.value === void 0 && e.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: e.value,
		inst: t
	}), e;
}
function Vo(e, t, n, r) {
	return t.issues.length ? (e.value = n.catchValue({
		...t,
		value: e.value,
		error: { issues: t.issues.map((e) => xr(e, r, Kr())) },
		input: e.value
	}), e) : (e.value = t.value, t.memo && (e.memo = !0), e);
}
var Ho = /*@__PURE__*/ F("$ZodCatch", (e, t) => {
	ya.init(e, t), P(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), P(e, "optout", (e) => e.def.innerType._zod.optout), P(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run({
			value: e.value,
			issues: []
		}, n);
		return r instanceof Promise ? r.then((r) => Vo(e, r, t, n)) : Vo(e, r, t, n);
	};
}), Uo = /*@__PURE__*/ F("$ZodPipe", (e, t) => {
	ya.init(e, t), P(e, "values", (e) => e.def.in._zod.values), P(e, "optin", (e) => e.def.in._zod.optin), P(e, "optout", (e) => e.def.out._zod.optout), P(e, "propValues", (e) => e.def.in._zod.propValues), e._zod.parse = (e, n) => {
		if (n.direction === "backward") {
			let r = t.out._zod.run(e, n);
			return r instanceof Promise ? r.then((e) => Wo(e, t.in, n)) : Wo(r, t.in, n);
		}
		let r = t.in._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Wo(e, t.out, n)) : Wo(r, t.out, n);
	};
});
function Wo(e, t, n) {
	return e.issues.some((e) => e.code !== "unrecognized_keys") ? (e.aborted = !0, e) : t._zod.run({
		value: e.value,
		issues: e.issues
	}, n);
}
var Go = /*@__PURE__*/ F("$ZodReadonly", (e, t) => {
	ya.init(e, t), P(e, "propValues", (e) => e.def.innerType._zod.propValues), P(e, "values", (e) => e.def.innerType._zod.values), P(e, "optin", (e) => e.def.innerType?._zod?.optin), P(e, "optout", (e) => e.def.innerType?._zod?.optout), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then(R) : R(r);
	};
});
function R(e) {
	return e.memo || (e.value = Object.freeze(e.value)), e;
}
var z = /*@__PURE__*/ F("$ZodCustom", (e, t) => {
	ea.init(e, t), ya.init(e, t), e._zod.parse = (e, t) => e, e._zod.check = (n) => {
		let r = n.value, i = t.fn(r);
		if (i instanceof Promise) return i.then((t) => Ko(t, n, r, e));
		Ko(i, n, r, e);
	};
});
function Ko(e, t, n, r) {
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
var qo = class extends Error {
	constructor() {
		super("Cannot parse a reference cycle that closes through a transform"), this.name = "ZodCyclicError";
	}
}, Jo = "~memo", Yo = [];
function Xo(e) {
	return typeof e == "object" && !!e;
}
function Zo(e) {
	return e.map((e) => e.path ? {
		...e,
		path: e.path.slice()
	} : { ...e });
}
var Qo = /*@__PURE__*/ new WeakMap(), $o = 0, es = 1, ts = 2;
function ns(e, t, n) {
	let r = Qo.get(e);
	if (r !== void 0) return r ? ts : $o;
	if (t.has(e)) return ts;
	t.add(e);
	let i = $o, a = (e) => {
		if (i !== ts && e?._zod) {
			let r = ns(e, t, n);
			r > i && (i = r);
		}
	}, o = (e, r) => {
		let i = $o;
		for (let a of Reflect.ownKeys(e)) {
			let o = Object.getOwnPropertyDescriptor(e, a);
			if (r && !o.enumerable) continue;
			let s = o.get ? es : o.value?._zod ? ns(o.value, t, n) : $o;
			s > i && (i = s);
		}
		return i;
	}, s = (e) => {
		e > i && (i = e);
	}, c = e._zod.def;
	switch (c.type) {
		case "object": {
			let e = Bn(c);
			s(e ? o(e, !0) : es), a(c.catchall);
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
			s(r ? ns(r, t, !1) : es);
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
	return t.delete(e), rs(e, i);
}
function rs(e, t) {
	return t !== es && Qo.set(e, t === ts), t;
}
function is(e, t) {
	let n = e.buckets.get(t);
	return n || (n = /* @__PURE__ */ new WeakMap(), e.buckets.set(t, n)), n;
}
var as, os = [], ss = {
	alloc(e, t, n) {
		let r = as;
		if (!r) return n;
		as = void 0;
		let i = {
			value: n,
			issues: null
		};
		return r.set(t.value, i), os.push(i), n;
	},
	guard(e) {
		var t;
		(t = e._zod).deferred ?? (t.deferred = []), e._zod.deferred.push(() => {
			let t = e._zod.parse, n = (e, n) => {
				if (n.direction !== "backward" && ls(n, e.value)) throw new qo();
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
					let i = ns(e, /* @__PURE__ */ new Set(), !1);
					if (i === $o) return e._zod.parse = t, e._zod.run === o && (e._zod.run = t), t(s, c);
					i === ts || r ? n = !0 : r = !0;
				}
				let l = s.value;
				if (!Xo(l)) return t(s, c);
				let u = c[Jo];
				u || (u = {
					buckets: /* @__PURE__ */ new WeakMap(),
					backEdges: void 0
				}, c[Jo] = u);
				let d;
				i === c ? d = a : (d = is(u, e), i = c, a = d);
				let f = d.get(l);
				if (f) return s.value = f.value, f.issues ? f.issues.length && s.issues.push(...Zo(f.issues)) : (s.memo = !0, u.backEdges ?? (u.backEdges = /* @__PURE__ */ new WeakSet()), u.backEdges.add(f.value)), s;
				as = d;
				let p = os.length, m = t(s, c);
				as = void 0;
				let h = os.length > p ? os.pop() : void 0;
				return m instanceof Promise ? m.then((e) => (h && (h.issues = e.issues.length ? Zo(e.issues) : Yo), e)) : (h && (h.issues = m.issues.length ? Zo(m.issues) : Yo), m);
			};
			e._zod.parse = o, e._zod.run === t && (e._zod.run = o);
		});
	}
};
function cs() {
	return ss;
}
function ls(e, t) {
	let n = e[Jo]?.backEdges;
	return n !== void 0 && Xo(t) && n.has(t);
}
//#endregion
//#region node_modules/zod/v4/locales/en.js
var us = () => {
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
function ds() {
	return { localeError: us() };
}
//#endregion
//#region node_modules/zod/v4/core/registries.js
var fs, ps = class {
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
function ms() {
	return new ps();
}
(fs = globalThis).__zod_globalRegistry ?? (fs.__zod_globalRegistry = ms());
var hs = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/zod/v4/core/api.js
function gs(e) {
	return e.checks &&= [...e.checks], e;
}
// @__NO_SIDE_EFFECTS__
function _s(e, t) {
	return new e(gs({
		type: "string",
		...N(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function vs(e, t) {
	return new e({
		type: "string",
		format: "email",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ys(e, t) {
	return new e({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function bs(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function xs(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v4",
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ss(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v6",
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Cs(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v7",
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ws(e, t) {
	return new e({
		type: "string",
		format: "url",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ts(e, t) {
	return new e({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Es(e, t) {
	return new e({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ds(e, t) {
	return new e({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Os(e, t) {
	return new e({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ks(e, t) {
	return new e({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function As(e, t) {
	return new e({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function js(e, t) {
	return new e({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ms(e, t) {
	return new e({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ns(e, t) {
	return new e({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ps(e, t) {
	return new e({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Fs(e, t) {
	return new e({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Is(e, t) {
	return new e({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ls(e, t) {
	return new e({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Rs(e, t) {
	return new e({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function zs(e, t) {
	return new e({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: !1,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Bs(e, t) {
	return new e({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: !1,
		local: !1,
		precision: null,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Vs(e, t) {
	return new e({
		type: "string",
		format: "date",
		check: "string_format",
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Hs(e, t) {
	return new e({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Us(e, t) {
	return new e({
		type: "string",
		format: "duration",
		check: "string_format",
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ws(e, t) {
	return new e(gs({
		type: "number",
		checks: [],
		...N(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function Gs(e, t) {
	return new e({
		type: "number",
		check: "number_format",
		abort: !1,
		format: "safeint",
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ks(e, t) {
	return new e({
		type: "boolean",
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function qs(e) {
	return new e({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function Js(e, t) {
	return new e({
		type: "never",
		...N(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ys(e, t) {
	return new ra({
		check: "less_than",
		...N(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function Xs(e, t) {
	return new ra({
		check: "less_than",
		...N(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function Zs(e, t) {
	return new ia({
		check: "greater_than",
		...N(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function Qs(e, t) {
	return new ia({
		check: "greater_than",
		...N(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function $s(e, t) {
	return new aa({
		check: "multiple_of",
		...N(t),
		value: e
	});
}
// @__NO_SIDE_EFFECTS__
function ec(e, t) {
	return new sa({
		check: "max_length",
		...N(t),
		maximum: e
	});
}
// @__NO_SIDE_EFFECTS__
function tc(e, t) {
	return new ca({
		check: "min_length",
		...N(t),
		minimum: e
	});
}
// @__NO_SIDE_EFFECTS__
function nc(e, t) {
	return new I({
		check: "length_equals",
		...N(t),
		length: e
	});
}
// @__NO_SIDE_EFFECTS__
function rc(e, t) {
	return new ua({
		check: "string_format",
		format: "regex",
		...N(t),
		pattern: e
	});
}
// @__NO_SIDE_EFFECTS__
function ic(e) {
	return new da({
		check: "string_format",
		format: "lowercase",
		...N(e)
	});
}
// @__NO_SIDE_EFFECTS__
function ac(e) {
	return new fa({
		check: "string_format",
		format: "uppercase",
		...N(e)
	});
}
// @__NO_SIDE_EFFECTS__
function oc(e, t) {
	return new pa({
		check: "string_format",
		format: "includes",
		...N(t),
		includes: e
	});
}
// @__NO_SIDE_EFFECTS__
function sc(e, t) {
	return new ma({
		check: "string_format",
		format: "starts_with",
		...N(t),
		prefix: e
	});
}
// @__NO_SIDE_EFFECTS__
function cc(e, t) {
	return new ha({
		check: "string_format",
		format: "ends_with",
		...N(t),
		suffix: e
	});
}
// @__NO_SIDE_EFFECTS__
function lc(e) {
	return new ga({
		check: "overwrite",
		tx: e
	});
}
// @__NO_SIDE_EFFECTS__
function uc(e) {
	return /* @__PURE__ */ lc((t) => t.normalize(e));
}
// @__NO_SIDE_EFFECTS__
function dc() {
	return /* @__PURE__ */ lc((e) => e.trim());
}
// @__NO_SIDE_EFFECTS__
function fc() {
	return /* @__PURE__ */ lc((e) => e.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function pc() {
	return /* @__PURE__ */ lc((e) => e.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function mc() {
	return /* @__PURE__ */ lc((e) => Jn(e));
}
// @__NO_SIDE_EFFECTS__
function hc(e, t, n) {
	return new e({
		type: "array",
		element: t,
		...N(n)
	});
}
// @__NO_SIDE_EFFECTS__
function gc(e, t, n) {
	return new e({
		type: "custom",
		check: "custom",
		fn: t,
		...N(n)
	});
}
// @__NO_SIDE_EFFECTS__
function _c(e, t) {
	let n = /* @__PURE__ */ vc((t) => (t.addIssue = (e) => {
		if (typeof e == "string") t.issues.push(Er(e, t.value, n._zod.def));
		else {
			let r = e;
			r.fatal && (r.continue = !1), r.code ??= "custom", "input" in r || (r.input = t.value), r.inst ??= n, r.continue ??= !n._zod.def.abort, t.issues.push(Er(r));
		}
	}, e(t.value, t)), t);
	return n;
}
// @__NO_SIDE_EFFECTS__
function vc(e, t) {
	let n = new ea({
		check: "custom",
		...N(t)
	});
	return n._zod.check = e, n;
}
//#endregion
//#region node_modules/zod/v4/core/to-json-schema.js
function yc(e, ...t) {
	for (let n of t) for (let t of Reflect.ownKeys(n)) Object.prototype.propertyIsEnumerable.call(n, t) && zn(e, t, n[t]);
	return e;
}
function bc(e) {
	let t = e?.target ?? "draft-2020-12";
	return t === "draft-4" && (t = "draft-04"), t === "draft-7" && (t = "draft-07"), {
		processors: e.processors ?? {},
		metadataRegistry: e?.metadata ?? hs,
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
function xc(e, t, n, r, i) {
	let a = typeof t.unrepresentable == "function" ? t.unrepresentable({
		zodSchema: e,
		path: r.path,
		message: i
	}) : t.unrepresentable;
	if (a === "any") return !1;
	if (a === void 0 || a === "throw") throw Error(i);
	return Object.assign(n, a), !0;
}
function Sc(e, t, n = {
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
		a && (o.ref ||= a, Sc(a, t, r), t.seen.get(a).isParent = !0);
	}
	let c = t.metadataRegistry.get(e);
	return c && yc(o.schema, c), t.io === "input" && Mc(e) && (delete o.schema.examples, delete o.schema.default), t.io === "input" && "_prefault" in o.schema && ((r = o.schema).default ?? (r.default = o.schema._prefault)), delete o.schema._prefault, t.seen.get(e).schema;
}
function Cc(e) {
	return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
function wc(e, t) {
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
				ref: `${i("__shared")}#/${r}/${Cc(a)}`
			};
		}
		let i = `#/${r}/`;
		if (t[1] === n && !t[1].schema.id) return { ref: "#" };
		let a = t[1].schema.id ?? `__schema${e.counter++}`;
		return {
			defId: a,
			ref: i + Cc(a)
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
function Tc(e) {
	let t = e.anyOf;
	if (!Array.isArray(t) || t.length === 0 || e.type !== void 0) return;
	let n = [];
	for (let e of t) {
		if (!e || typeof e != "object") return;
		Tc(e);
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
var Ec = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]), Dc = ["oneOf", "anyOf"];
function Oc(e) {
	let t = e.additionalProperties;
	return t === void 0 || t === !1 || typeof t != "object" || !t ? null : Object.keys(t).length ? t : null;
}
function kc(e) {
	let t = [];
	for (let n of e) {
		if (typeof n != "object" || n.type !== "object") return null;
		for (let e in n) if (!Ec.has(e)) return null;
		t.push(n);
	}
	let n = {}, r = /* @__PURE__ */ new Set();
	for (let e of t) {
		for (let r in e.properties) {
			if (Object.prototype.hasOwnProperty.call(n, r)) continue;
			let e = [];
			for (let n of t) {
				let t = n.properties?.[r] ?? Oc(n);
				t != null && (e.some((e) => JSON.stringify(e) === JSON.stringify(t)) || e.push(t));
			}
			zn(n, r, e.length === 1 ? e[0] : kc(e) ?? { allOf: e });
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
			let t = Oc(n);
			t && !e.some((e) => JSON.stringify(e) === JSON.stringify(t)) && e.push(t);
		}
		e.length === 1 ? i.additionalProperties = e[0] : e.length > 1 && (i.additionalProperties = { allOf: e });
	}
	return i;
}
function Ac(e) {
	let t = e.allOf;
	if (!Array.isArray(t) || t.length < 2) return;
	for (let t of Ec) if (t in e) return;
	let n = t.filter((e) => Dc.some((t) => Array.isArray(e[t]))), r = null;
	if (!n.length) r = kc(t);
	else {
		let e = n[0], i = Dc.find((t) => Array.isArray(e[t]));
		if (Object.keys(e).length !== 1) return;
		let a = t.filter((t) => t !== e), o = e[i].map((e) => kc([...a, e]));
		if (o.some((e) => !e)) return;
		r = { [i]: o };
	}
	r && (delete e.allOf, yc(e, r));
}
function jc(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	let r = (t) => {
		let n = e.seen.get(t);
		if (n.ref === null) return;
		let i = n.def ?? n.schema, a = { ...i }, o = n.ref;
		if (n.ref = null, o) {
			r(o);
			let n = e.seen.get(o), s = n.schema;
			if (s.$ref && (e.target === "draft-07" || e.target === "draft-04" || e.target === "openapi-3.0") ? (i.allOf = i.allOf ?? [], i.allOf.push(s)) : yc(i, s), yc(i, a), t._zod.parent === o) for (let e in i) e !== "$ref" && e !== "allOf" && (e in a || delete i[e]);
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
		if (e.target !== "openapi-3.0") for (let t of e.seen.entries()) Tc(t[1].def ?? t[1].schema);
		for (let t of e.deferred) t();
		if (e.intersections.length) {
			let t = /* @__PURE__ */ new Map();
			for (let n of e.seen.values()) for (let e of [n.schema, n.def]) {
				let n = e?.allOf;
				if (!Array.isArray(n)) continue;
				let r = t.get(n);
				r ? r.push(e) : t.set(n, [e]);
			}
			for (let n of e.intersections) for (let e of t.get(n) ?? []) Ac(e);
		}
	}
	let i = {};
	if (e.target === "draft-2020-12" ? i.$schema = "https://json-schema.org/draft/2020-12/schema" : e.target === "draft-07" ? i.$schema = "http://json-schema.org/draft-07/schema#" : e.target === "draft-04" ? i.$schema = "http://json-schema.org/draft-04/schema#" : e.target, e.external?.uri) {
		let n = e.external.registry.get(t)?.id;
		if (!n) throw Error("Schema is missing an `id` property");
		i.$id = e.external.uri(n);
	}
	yc(i, n.defId ? n.schema : n.def ?? n.schema);
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
					input: Pc(t, "input", e.processors),
					output: Pc(t, "output", e.processors)
				}
			},
			enumerable: !1,
			writable: !1
		}), n;
	} catch {
		throw Error("Error converting schema to JSON.");
	}
}
function Mc(e, t) {
	let n = t ?? { seen: /* @__PURE__ */ new Set() };
	if (n.seen.has(e)) return !1;
	n.seen.add(e);
	let r = e._zod.def;
	if (r.type === "transform") return !0;
	if (r.type === "array") return Mc(r.element, n);
	if (r.type === "set") return Mc(r.valueType, n);
	if (r.type === "lazy") return Mc(r.getter(), n);
	if (r.type === "promise" || r.type === "optional" || r.type === "nonoptional" || r.type === "nullable" || r.type === "readonly" || r.type === "default" || r.type === "prefault" || r.type === "catch") return Mc(r.innerType, n);
	if (r.type === "intersection") return Mc(r.left, n) || Mc(r.right, n);
	if (r.type === "record" || r.type === "map") return Mc(r.keyType, n) || Mc(r.valueType, n);
	if (r.type === "pipe") return e._zod.traits.has("$ZodCodec") ? !0 : Mc(r.in, n) || Mc(r.out, n);
	if (r.type === "object") {
		for (let e in r.shape) if (Mc(r.shape[e], n)) return !0;
		return !1;
	}
	if (r.type === "union") {
		for (let e of r.options) if (Mc(e, n)) return !0;
		return !1;
	}
	if (r.type === "tuple") {
		for (let e of r.items) if (Mc(e, n)) return !0;
		return !!(r.rest && Mc(r.rest, n));
	}
	return !1;
}
var Nc = (e, t = {}) => (n) => {
	let r = bc({
		...n,
		processors: t
	});
	return Sc(e, r), wc(r, e), jc(r, e);
}, Pc = (e, t, n = {}) => (r) => {
	let { libraryOptions: i, target: a } = r ?? {}, o = bc({
		...i ?? {},
		target: a,
		io: t,
		processors: n
	});
	return Sc(e, o), wc(o, e), jc(o, e);
}, Fc = (e, t, n) => {
	(e[t] === void 0 || n > e[t]) && (e[t] = n);
}, Ic = (e, t, n) => {
	(e[t] === void 0 || n < e[t]) && (e[t] = n);
}, Lc = (e, t) => {
	Fc(e, "minimum", t), Ic(e, "maximum", t);
}, Rc = (e, t) => {
	e.multipleOf ??= [], e.multipleOf.includes(t) || e.multipleOf.push(t);
}, zc = (e, t) => {
	e.patterns ??= /* @__PURE__ */ new Set(), e.patterns.add(t);
}, Bc = (e, t) => {
	e.mime = e.mime ? e.mime.filter((e) => t.includes(e)) : [...t];
}, Vc = (e, t) => {
	e.format = t, t.includes("int") && (e.isInt = !0);
}, Hc = (e, t) => Fc(e, "minimum", t.minimum), Uc = (e, t) => Ic(e, "maximum", t.maximum), Wc = (e) => (t, n) => {
	Vc(t, n.format);
	let [r, i] = e[n.format];
	Fc(t, "minimum", r), Ic(t, "maximum", i);
}, Gc = {
	greater_than: (e, t) => Fc(e, t.inclusive ? "minimum" : "exclusiveMinimum", t.value),
	less_than: (e, t) => Ic(e, t.inclusive ? "maximum" : "exclusiveMaximum", t.value),
	multiple_of: (e, t) => Rc(e, t.value),
	number_format: Wc(ar),
	bigint_format: Wc(or),
	min_length: Hc,
	max_length: Uc,
	length_equals: (e, t) => Lc(e, t.length),
	min_size: Hc,
	max_size: Uc,
	size_equals: (e, t) => Lc(e, t.size),
	string_format: (e, t) => {
		Vc(e, t.format), t.pattern && zc(e, t.pattern), (t.format === "base64" || t.format === "base64url") && (e.contentEncoding = t.format), (t.local || t.precision === -1) && (e.laxFormat = !0);
	},
	mime_type: (e, t) => Bc(e, t.mime)
};
function Kc(e) {
	let t = {}, n = e._zod.def, r = e._zod.traits.has("$ZodCheck") ? [e, ...n.checks ?? []] : n.checks ?? [];
	for (let e of r) Gc[e._zod.def.check]?.(t, e._zod.def);
	let i = e._zod.bag;
	i.minimum !== void 0 && Fc(t, "minimum", i.minimum), i.exclusiveMinimum !== void 0 && Fc(t, "exclusiveMinimum", i.exclusiveMinimum), i.maximum !== void 0 && Ic(t, "maximum", i.maximum), i.exclusiveMaximum !== void 0 && Ic(t, "exclusiveMaximum", i.exclusiveMaximum), i.multipleOf !== void 0 && Rc(t, i.multipleOf), i.format !== void 0 && (t.format ??= i.format, i.format.includes("int") && (t.isInt = !0)), i.mime && Bc(t, i.mime);
	for (let e of i.patterns ?? []) zc(t, e);
	return t;
}
var qc = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
}, Jc = /* @__PURE__ */ new Map([[eo, zi], [no, Bi]]), Yc = (e) => Jc.get(e) ?? e, Xc = (e, t, n, r) => {
	let i = n;
	i.type = "string";
	let { minimum: a, maximum: o, format: s, patterns: c, contentEncoding: l, laxFormat: u } = Kc(e);
	if (typeof a == "number" && (i.minLength = a), typeof o == "number" && (i.maxLength = o), s && (i.format = qc[s] ?? s, i.format === "" && delete i.format, (s === "time" || u) && delete i.format), l && (i.contentEncoding = l), c && c.size > 0) {
		let e = [...c].map(Yc);
		e.length === 1 ? i.pattern = e[0].source : e.length > 1 && (i.allOf = [...e.map((e) => ({
			...t.target === "draft-07" || t.target === "draft-04" || t.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: e.source
		}))]);
	}
}, Zc = (e, t, n, r) => {
	let i = n, { minimum: a, maximum: o, multipleOf: s, exclusiveMaximum: c, exclusiveMinimum: l, isInt: u } = Kc(e);
	i.type = u ? "integer" : "number";
	let d = typeof l == "number" && l >= (a ?? -Infinity), f = typeof c == "number" && c <= (o ?? Infinity), p = t.target === "draft-04" || t.target === "openapi-3.0";
	if (d ? p ? (i.minimum = l, i.exclusiveMinimum = !0) : i.exclusiveMinimum = l : typeof a == "number" && (i.minimum = a), f ? p ? (i.maximum = c, i.exclusiveMaximum = !0) : i.exclusiveMaximum = c : typeof o == "number" && (i.maximum = o), s) {
		let n = /* @__PURE__ */ new Set();
		for (let a of s) Number.isFinite(a) && a !== 0 ? n.add(Math.abs(a)) : xc(e, t, i, r, `A multipleOf divisor of ${a} cannot be represented in JSON Schema`);
		let [a, ...o] = n;
		a !== void 0 && (i.multipleOf = a), o.length && (i.allOf = [...i.allOf ?? [], ...o.map((e) => ({ multipleOf: e }))]);
	}
}, Qc = (e, t, n, r) => {
	n.type = "boolean";
}, $c = (e, t, n, r) => {
	n.not = {};
}, el = (e, t, n, r) => {
	let i = e._zod.def, a = jn(i.entries);
	if (a.length === 0) {
		n.not = {};
		return;
	}
	a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), n.enum = a;
}, tl = (e, t, n, r) => {
	let i = e._zod.def;
	if (i.values.length === 0) {
		n.not = {};
		return;
	}
	let a = [];
	for (let o of i.values) if (o === void 0) {
		if (xc(e, t, n, r, "Literal `undefined` cannot be represented in JSON Schema")) return;
	} else if (typeof o == "bigint") {
		if (xc(e, t, n, r, "BigInt literals cannot be represented in JSON Schema")) return;
		a.push(Number(o));
	} else a.push(o);
	if (a.length !== 0) {
		if (a.length === 1) {
			let e = a[0];
			n.type = e === null ? "null" : typeof e, t.target === "draft-04" || t.target === "openapi-3.0" ? n.enum = [e] : n.const = e;
		} else a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), a.every((e) => typeof e == "boolean") && (n.type = "boolean"), a.every((e) => e === null) && (n.type = "null"), n.enum = a;
	}
}, nl = (e, t, n, r) => {
	xc(e, t, n, r, "Custom types cannot be represented in JSON Schema");
}, rl = (e, t, n, r) => {
	xc(e, t, n, r, "Transforms cannot be represented in JSON Schema");
}, il = (e, t, n, r) => {
	let i = n, a = e._zod.def, { minimum: o, maximum: s } = Kc(e);
	typeof o == "number" && (i.minItems = o), typeof s == "number" && (i.maxItems = s), i.type = "array", i.items = Sc(a.element, t, {
		...r,
		path: [...r.path, "items"]
	});
};
function al(e) {
	let t = e._zod.def;
	return t.type === "pipe" && t.in._zod.traits.has("$ZodTransform") ? al(t.out) : t.type === "catch" ? al(t.innerType) : e._zod.optin;
}
var ol = (e, t, n, r) => {
	let i = n, a = e._zod.def, o = a.shape;
	if (Object.getOwnPropertySymbols(o).length && xc(e, t, i, r, "Symbol keys cannot be represented in JSON Schema")) return;
	i.type = "object", i.properties = {};
	for (let e in o) zn(i.properties, e, Sc(o[e], t, {
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
		(t.io === "input" ? al(n) === void 0 : n._zod.optout === void 0) && s.push(e);
	}
	s.length > 0 && (i.required = s), a.catchall?._zod.def.type === "never" ? i.additionalProperties = !1 : a.catchall ? a.catchall && (i.additionalProperties = Sc(a.catchall, t, {
		...r,
		path: [...r.path, "additionalProperties"]
	})) : t.io === "output" && (i.additionalProperties = !1);
}, sl = (e, t, n, r) => {
	let i = e._zod.def, a = i.inclusive === !1, o = i.options.map((e, n) => Sc(e, t, {
		...r,
		path: [
			...r.path,
			a ? "oneOf" : "anyOf",
			n
		]
	}));
	a ? n.oneOf = o : n.anyOf = o;
}, cl = (e, t, n, r) => {
	let i = e._zod.def, a = Sc(i.left, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			0
		]
	}), o = Sc(i.right, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			1
		]
	}), s = (e) => "allOf" in e && Object.keys(e).length === 1, c = [...s(a) ? a.allOf : [a], ...s(o) ? o.allOf : [o]];
	n.allOf = c, t.intersections.push(c);
}, ll = (e, t, n, r) => {
	let i = e._zod.def, a = Sc(i.innerType, t, r), o = t.seen.get(e);
	t.target === "openapi-3.0" ? (o.ref = i.innerType, n.nullable = !0) : n.anyOf = [a, { type: "null" }];
}, ul = (e, t, n, r) => {
	let i = e._zod.def;
	Sc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, dl = Symbol();
function fl(e, t, n, r, i) {
	let a = !1, o = JSON.stringify(e, (e, t) => typeof t == "bigint" ? (a = !0, null) : t);
	return a ? (xc(t, n, r, i, "BigInt defaults cannot be represented in JSON Schema"), dl) : JSON.parse(o);
}
var pl = (e, t, n, r) => {
	let i = e._zod.def;
	Sc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o = fl(i.defaultValue, e, t, n, r);
	o !== dl && (n.default = o);
}, ml = (e, t, n, r) => {
	let i = e._zod.def;
	Sc(i.innerType, t, r);
	let a = t.seen.get(e);
	if (a.ref = i.innerType, t.io !== "input") return;
	let o = fl(i.defaultValue, e, t, n, r);
	o !== dl && (n._prefault = o);
}, hl = (e, t, n, r) => {
	let i = e._zod.def;
	Sc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o;
	try {
		o = i.catchValue(void 0);
	} catch {
		xc(e, t, n, r, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	n.default = o;
}, gl = (e, t, n, r) => {
	let i = e._zod.def, a = i.in._zod.traits.has("$ZodTransform"), o = t.io === "input" ? a ? i.out : i.in : i.out;
	Sc(o, t, r);
	let s = t.seen.get(e);
	s.ref = o;
}, _l = (e, t, n, r) => {
	let i = e._zod.def;
	Sc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, n.readOnly = !0;
}, vl = (e, t, n, r) => {
	let i = e._zod.def;
	Sc(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, yl = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function bl(e, t, n) {
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
var xl = /*@__PURE__*/ F("ZodError", (e, t) => {
	$r.init(e, t), e.name = "ZodError";
	let n = Object.getPrototypeOf(e);
	yl.has(n) || (yl.add(n), bl(n, "format", (e) => (t) => ni(e, t)), bl(n, "flatten", (e) => (t) => ti(e, t)), bl(n, "addIssue", (e) => (t) => {
		e.issues.push(t), e.message = JSON.stringify(e.issues, Nn, 2);
	}), bl(n, "addIssues", (e) => (t) => {
		e.issues.push(...t), e.message = JSON.stringify(e.issues, Nn, 2);
	}), Object.defineProperty(n, "isEmpty", {
		configurable: !0,
		enumerable: !1,
		get() {
			return this.issues.length === 0;
		}
	}));
}, void 0, { Parent: Error }), Sl = /* @__PURE__ */ ii(xl), Cl = /* @__PURE__ */ ai(xl), wl = /* @__PURE__ */ oi(xl), Tl = /* @__PURE__ */ ci(xl), El = /* @__PURE__ */ mi(xl), Dl = /* @__PURE__ */ hi(xl), Ol = /* @__PURE__ */ gi(xl), kl = /* @__PURE__ */ _i(xl), Al = /* @__PURE__ */ vi(xl), jl = /* @__PURE__ */ yi(xl), Ml = /* @__PURE__ */ bi(xl), Nl = /* @__PURE__ */ xi(xl);
//#endregion
//#region node_modules/zod/v4/classic/schemas.js
function Pl() {
	Gr.localeError || Kr(ds());
}
function Fl() {
	Gr.memoizer || Kr({ memoizer: cs() });
}
var Il = /*@__PURE__*/ F("ZodType", (e, t) => (Pl(), ya.init(e, t), e.def = t, e.type = t.type, e), {
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
		return this.check(Zu(e, t));
	},
	superRefine(e, t) {
		return this.check(Qu(e, t));
	},
	overwrite(e) {
		return this.check(/* @__PURE__ */ lc(e));
	},
	optional() {
		return Nu(this);
	},
	exactOptional() {
		return Fu(this);
	},
	nullable() {
		return Lu(this);
	},
	nullish() {
		return Nu(Lu(this));
	},
	nonoptional(e) {
		return Uu(this, e);
	},
	array() {
		return yu(this);
	},
	or(e) {
		return Su([this, e]);
	},
	and(e) {
		return Eu(this, e);
	},
	transform(e) {
		return qu(this, ju(e));
	},
	default(e) {
		return zu(this, e);
	},
	prefault(e) {
		return Vu(this, e);
	},
	catch(e) {
		return Gu(this, e);
	},
	pipe(e) {
		return qu(this, e);
	},
	readonly() {
		return Yu(this);
	},
	describe(e) {
		let t = this.clone();
		return hs.add(t, { description: e }), t;
	},
	meta(...e) {
		if (e.length === 0) return hs.get(this);
		let t = this.clone();
		return hs.add(t, e[0]), t;
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
			...Sa(this),
			jsonSchema: {
				input: Pc(this, "input"),
				output: Pc(this, "output")
			}
		});
	},
	set "~standard"(e) {
		Or(this, "~standard", e);
	},
	parse: function e(t, n) {
		return Sl(this, t, n, { callee: e });
	},
	parseAsync: async function e(t, n) {
		return await Cl(this, t, n, { callee: e });
	},
	safeParse(e, t) {
		return wl(this, e, t);
	},
	async safeParseAsync(e, t) {
		return Tl(this, e, t);
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
		return El(this, t, n, { callee: e });
	},
	decode: function e(t, n) {
		return Dl(this, t, n, { callee: e });
	},
	encodeAsync: async function e(t, n) {
		return await Ol(this, t, n, { callee: e });
	},
	decodeAsync: async function e(t, n) {
		return await kl(this, t, n, { callee: e });
	},
	safeEncode(e, t) {
		return Al(this, e, t);
	},
	safeDecode(e, t) {
		return jl(this, e, t);
	},
	async safeEncodeAsync(e, t) {
		return Ml(this, e, t);
	},
	async safeDecodeAsync(e, t) {
		return Nl(this, e, t);
	},
	toJSONSchema(e) {
		return Nc(this, {})(e);
	},
	get description() {
		return hs.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
}), Ll = /*@__PURE__*/ F("_ZodString", (e, t) => {
	Ca.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => Xc(e, t, n, r);
}, /*@__PURE__*/ Ar({
	format: (e) => Kc(e).format ?? null,
	minLength: (e) => Kc(e).minimum ?? null,
	maxLength: (e) => Kc(e).maximum ?? null
}, {
	regex(...e) {
		return this.check(/* @__PURE__ */ rc(...e));
	},
	includes(...e) {
		return this.check(/* @__PURE__ */ oc(...e));
	},
	startsWith(...e) {
		return this.check(/* @__PURE__ */ sc(...e));
	},
	endsWith(...e) {
		return this.check(/* @__PURE__ */ cc(...e));
	},
	min(...e) {
		return this.check(/* @__PURE__ */ tc(...e));
	},
	max(...e) {
		return this.check(/* @__PURE__ */ ec(...e));
	},
	length(...e) {
		return this.check(/* @__PURE__ */ nc(...e));
	},
	nonempty(...e) {
		return this.check(/* @__PURE__ */ tc(1, ...e));
	},
	lowercase(e) {
		return this.check(/* @__PURE__ */ ic(e));
	},
	uppercase(e) {
		return this.check(/* @__PURE__ */ ac(e));
	},
	trim() {
		return this.check(/* @__PURE__ */ dc());
	},
	normalize(...e) {
		return this.check(/* @__PURE__ */ uc(...e));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ fc());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ pc());
	},
	slugify() {
		return this.check(/* @__PURE__ */ mc());
	}
})), Rl = /*@__PURE__*/ F("ZodString", (e, t) => {
	Ca.init(e, t), Ll.init(e, t);
}, {
	email(e) {
		return this.check(/* @__PURE__ */ vs(Wl, e));
	},
	url(e) {
		return this.check(/* @__PURE__ */ ws(Jl, e));
	},
	jwt(e) {
		return this.check(/* @__PURE__ */ zs(V, e));
	},
	emoji(e) {
		return this.check(/* @__PURE__ */ Ts(Yl, e));
	},
	guid(e) {
		return this.check(/* @__PURE__ */ ys(Gl, e));
	},
	uuid(e) {
		return this.check(/* @__PURE__ */ bs(Kl, e));
	},
	uuidv4(e) {
		return this.check(/* @__PURE__ */ xs(Kl, e));
	},
	uuidv6(e) {
		return this.check(/* @__PURE__ */ Ss(Kl, e));
	},
	uuidv7(e) {
		return this.check(/* @__PURE__ */ Cs(Kl, e));
	},
	nanoid(e) {
		return this.check(/* @__PURE__ */ Es(Xl, e));
	},
	cuid(e) {
		return this.check(/* @__PURE__ */ Ds(Zl, e));
	},
	cuid2(e) {
		return this.check(/* @__PURE__ */ Os(Ql, e));
	},
	ulid(e) {
		return this.check(/* @__PURE__ */ ks($l, e));
	},
	base64(e) {
		return this.check(/* @__PURE__ */ Is(ou, e));
	},
	base64url(e) {
		return this.check(/* @__PURE__ */ Ls(su, e));
	},
	xid(e) {
		return this.check(/* @__PURE__ */ As(eu, e));
	},
	ksuid(e) {
		return this.check(/* @__PURE__ */ js(tu, e));
	},
	ipv4(e) {
		return this.check(/* @__PURE__ */ Ms(nu, e));
	},
	ipv6(e) {
		return this.check(/* @__PURE__ */ Ns(ru, e));
	},
	cidrv4(e) {
		return this.check(/* @__PURE__ */ Ps(iu, e));
	},
	cidrv6(e) {
		return this.check(/* @__PURE__ */ Fs(au, e));
	},
	e164(e) {
		return this.check(/* @__PURE__ */ Rs(cu, e));
	},
	datetime(e) {
		return this.check(/* @__PURE__ */ Bs(Bl, e));
	},
	date(e) {
		return this.check(/* @__PURE__ */ Vs(Vl, e));
	},
	time(e) {
		return this.check(/* @__PURE__ */ Hs(Hl, e));
	},
	duration(e) {
		return this.check(/* @__PURE__ */ Us(Ul, e));
	}
});
function B(e) {
	return /* @__PURE__ */ _s(Rl, e);
}
var zl = /*@__PURE__*/ F("ZodStringFormat", (e, t) => {
	L.init(e, t), Ll.init(e, t);
}), Bl = /*@__PURE__*/ F("ZodISODateTime", (e, t) => {
	Ha.init(e, t), zl.init(e, t);
}), Vl = /*@__PURE__*/ F("ZodISODate", (e, t) => {
	Ua.init(e, t), zl.init(e, t);
}), Hl = /*@__PURE__*/ F("ZodISOTime", (e, t) => {
	Wa.init(e, t), zl.init(e, t);
}), Ul = /*@__PURE__*/ F("ZodISODuration", (e, t) => {
	Ga.init(e, t), zl.init(e, t);
}), Wl = /*@__PURE__*/ F("ZodEmail", (e, t) => {
	Ea.init(e, t), zl.init(e, t);
}), Gl = /*@__PURE__*/ F("ZodGUID", (e, t) => {
	wa.init(e, t), zl.init(e, t);
}), Kl = /*@__PURE__*/ F("ZodUUID", (e, t) => {
	Ta.init(e, t), zl.init(e, t);
});
function ql(e) {
	return /* @__PURE__ */ bs(Kl, e);
}
var Jl = /*@__PURE__*/ F("ZodURL", (e, t) => {
	Pa.init(e, t), zl.init(e, t);
}), Yl = /*@__PURE__*/ F("ZodEmoji", (e, t) => {
	Fa.init(e, t), zl.init(e, t);
}), Xl = /*@__PURE__*/ F("ZodNanoID", (e, t) => {
	Ia.init(e, t), zl.init(e, t);
}), Zl = /*@__PURE__*/ F("ZodCUID", (e, t) => {
	La.init(e, t), zl.init(e, t);
}), Ql = /*@__PURE__*/ F("ZodCUID2", (e, t) => {
	Ra.init(e, t), zl.init(e, t);
}), $l = /*@__PURE__*/ F("ZodULID", (e, t) => {
	za.init(e, t), zl.init(e, t);
}), eu = /*@__PURE__*/ F("ZodXID", (e, t) => {
	Ba.init(e, t), zl.init(e, t);
}), tu = /*@__PURE__*/ F("ZodKSUID", (e, t) => {
	Va.init(e, t), zl.init(e, t);
}), nu = /*@__PURE__*/ F("ZodIPv4", (e, t) => {
	Ka.init(e, t), zl.init(e, t);
}), ru = /*@__PURE__*/ F("ZodIPv6", (e, t) => {
	Ya.init(e, t), zl.init(e, t);
}), iu = /*@__PURE__*/ F("ZodCIDRv4", (e, t) => {
	Xa.init(e, t), zl.init(e, t);
}), au = /*@__PURE__*/ F("ZodCIDRv6", (e, t) => {
	Qa.init(e, t), zl.init(e, t);
}), ou = /*@__PURE__*/ F("ZodBase64", (e, t) => {
	to.init(e, t), zl.init(e, t);
}), su = /*@__PURE__*/ F("ZodBase64URL", (e, t) => {
	io.init(e, t), zl.init(e, t);
}), cu = /*@__PURE__*/ F("ZodE164", (e, t) => {
	ao.init(e, t), zl.init(e, t);
}), V = /*@__PURE__*/ F("ZodJWT", (e, t) => {
	so.init(e, t), zl.init(e, t);
}), lu = /*@__PURE__*/ F("ZodNumber", (e, t) => {
	co.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => Zc(e, t, n, r), e.isFinite = !0;
}, /*@__PURE__*/ Ar({
	minValue: (e) => {
		let { minimum: t, exclusiveMinimum: n } = Kc(e);
		return Math.max(t ?? -Infinity, n ?? -Infinity);
	},
	maxValue: (e) => {
		let { maximum: t, exclusiveMaximum: n } = Kc(e);
		return Math.min(t ?? Infinity, n ?? Infinity);
	},
	isInt: (e) => {
		let { isInt: t, multipleOf: n } = Kc(e);
		return !!t || !!n?.some(Number.isSafeInteger);
	},
	format: (e) => Kc(e).format ?? null
}, {
	gt(e, t) {
		return this.check(/* @__PURE__ */ Zs(e, t));
	},
	gte(e, t) {
		return this.check(/* @__PURE__ */ Qs(e, t));
	},
	min(e, t) {
		return this.check(/* @__PURE__ */ Qs(e, t));
	},
	lt(e, t) {
		return this.check(/* @__PURE__ */ Ys(e, t));
	},
	lte(e, t) {
		return this.check(/* @__PURE__ */ Xs(e, t));
	},
	max(e, t) {
		return this.check(/* @__PURE__ */ Xs(e, t));
	},
	int(e) {
		return this.check(du(e));
	},
	safe(e) {
		return this.check(du(e));
	},
	positive(e) {
		return this.check(/* @__PURE__ */ Zs(0, e));
	},
	nonnegative(e) {
		return this.check(/* @__PURE__ */ Qs(0, e));
	},
	negative(e) {
		return this.check(/* @__PURE__ */ Ys(0, e));
	},
	nonpositive(e) {
		return this.check(/* @__PURE__ */ Xs(0, e));
	},
	multipleOf(e, t) {
		return this.check(/* @__PURE__ */ $s(e, t));
	},
	step(e, t) {
		return this.check(/* @__PURE__ */ $s(e, t));
	},
	finite() {
		return this;
	}
}));
function H(e) {
	return /* @__PURE__ */ Ws(lu, e);
}
var uu = /*@__PURE__*/ F("ZodNumberFormat", (e, t) => {
	lo.init(e, t), lu.init(e, t);
});
function du(e) {
	return /* @__PURE__ */ Gs(uu, e);
}
var fu = /*@__PURE__*/ F("ZodBoolean", (e, t) => {
	uo.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => Qc(e, t, n, r);
});
function pu(e) {
	return /* @__PURE__ */ Ks(fu, e);
}
var mu = /*@__PURE__*/ F("ZodUnknown", (e, t) => {
	fo.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (e, t, n) => void 0;
});
function hu() {
	return /* @__PURE__ */ qs(mu);
}
var gu = /*@__PURE__*/ F("ZodNever", (e, t) => {
	po.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => $c(e, t, n, r);
});
function _u(e) {
	return /* @__PURE__ */ Js(gu, e);
}
var vu = /*@__PURE__*/ F("ZodArray", (e, t) => {
	Fl(), ho.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => il(e, t, n, r), e.element = t.element;
}, {
	min(e, t) {
		return this.check(/* @__PURE__ */ tc(e, t));
	},
	nonempty(e) {
		return this.check(/* @__PURE__ */ tc(1, e));
	},
	max(e, t) {
		return this.check(/* @__PURE__ */ ec(e, t));
	},
	length(e, t) {
		return this.check(/* @__PURE__ */ nc(e, t));
	},
	unwrap() {
		return this.element;
	}
});
function yu(e, t) {
	return /* @__PURE__ */ hc(vu, e, t);
}
var bu = /*@__PURE__*/ F("ZodObject", (e, t) => {
	Fl(), xo.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => ol(e, t, n, r), Ir(e, "shape", (e) => e._zod.def.shape, !1);
}, {
	keyof() {
		return Ou(Object.keys(this._zod.def.shape));
	},
	catchall(e) {
		return this.clone(Kn(this._zod.def, { catchall: e }));
	},
	passthrough() {
		return this.clone(Kn(this._zod.def, { catchall: hu() }));
	},
	loose() {
		return this.clone(Kn(this._zod.def, { catchall: hu() }));
	},
	strict() {
		return this.clone(Kn(this._zod.def, { catchall: _u() }));
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
		return mr(Mu, this, e[0]);
	},
	exactPartial(...e) {
		return mr(Pu, this, e[0], "exactPartial");
	},
	required(...e) {
		return hr(Hu, this, e[0]);
	}
});
function U(e, t) {
	return new bu({
		type: "object",
		shape: e ?? {},
		...N(t)
	});
}
var xu = /*@__PURE__*/ F("ZodUnion", (e, t) => {
	Co.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => sl(e, t, n, r), e.options = t.options;
});
function Su(e, t) {
	return new xu({
		type: "union",
		options: e,
		...N(t)
	});
}
var Cu = /*@__PURE__*/ F("ZodDiscriminatedUnion", (e, t) => {
	xu.init(e, t), To.init(e, t);
});
function wu(e, t, n) {
	return new Cu({
		type: "union",
		options: t,
		discriminator: e,
		...N(n)
	});
}
var Tu = /*@__PURE__*/ F("ZodIntersection", (e, t) => {
	Eo.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => cl(e, t, n, r);
});
function Eu(e, t) {
	return new Tu({
		type: "intersection",
		left: e,
		right: t
	});
}
var Du = /*@__PURE__*/ F("ZodEnum", (e, t) => {
	ko.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => el(e, t, n, r), e.enum = t.entries, e.options = [...e._zod.values];
	let n = new Set(Object.keys(t.entries));
	e.extract = (e, r) => {
		let i = {};
		for (let r of e) if (n.has(r)) i[r] = t.entries[r];
		else throw Error(`Key ${r} not found in enum`);
		return new Du({
			...t,
			checks: [],
			...N(r),
			entries: i
		});
	}, e.exclude = (e, r) => {
		let i = { ...t.entries };
		for (let t of e) if (n.has(t)) delete i[t];
		else throw Error(`Key ${t} not found in enum`);
		return new Du({
			...t,
			checks: [],
			...N(r),
			entries: i
		});
	};
});
function Ou(e, t) {
	return new Du({
		type: "enum",
		entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
		...N(t)
	});
}
var ku = /*@__PURE__*/ F("ZodLiteral", (e, t) => {
	Ao.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => tl(e, t, n, r), e.values = new Set(t.values), Object.defineProperty(e, "value", { get() {
		if (t.values.length > 1) throw Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return t.values[0];
	} });
});
function W(e, t) {
	return new ku({
		type: "literal",
		values: Array.isArray(e) ? e : [e],
		...N(t)
	});
}
var Au = /*@__PURE__*/ F("ZodTransform", (e, t) => {
	Fl(), jo.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => rl(e, t, n, r), e._zod.parse = (n, r) => {
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
function ju(e) {
	return new Au({
		type: "transform",
		transform: e
	});
}
var Mu = /*@__PURE__*/ F("ZodOptional", (e, t) => {
	No.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => vl(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Nu(e) {
	return new Mu({
		type: "optional",
		innerType: e
	});
}
var Pu = /*@__PURE__*/ F("ZodExactOptional", (e, t) => {
	Po.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => vl(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Fu(e) {
	return new Pu({
		type: "optional",
		innerType: e
	});
}
var Iu = /*@__PURE__*/ F("ZodNullable", (e, t) => {
	Fo.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => ll(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Lu(e) {
	return new Iu({
		type: "nullable",
		innerType: e
	});
}
var Ru = /*@__PURE__*/ F("ZodDefault", (e, t) => {
	Io.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => pl(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeDefault = e.unwrap;
});
function zu(e, t) {
	return new Ru({
		type: "default",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : $n(t);
		}
	});
}
var Bu = /*@__PURE__*/ F("ZodPrefault", (e, t) => {
	Ro.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => ml(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Vu(e, t) {
	return new Bu({
		type: "prefault",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : $n(t);
		}
	});
}
var Hu = /*@__PURE__*/ F("ZodNonOptional", (e, t) => {
	zo.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => ul(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Uu(e, t) {
	return new Hu({
		type: "nonoptional",
		innerType: e,
		...N(t)
	});
}
var Wu = /*@__PURE__*/ F("ZodCatch", (e, t) => {
	Ho.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => hl(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeCatch = e.unwrap;
});
function Gu(e, t) {
	return new Wu({
		type: "catch",
		innerType: e,
		catchValue: typeof t == "function" ? t : Rr(t)
	});
}
var Ku = /*@__PURE__*/ F("ZodPipe", (e, t) => {
	Uo.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => gl(e, t, n, r), e.in = t.in, e.out = t.out;
});
function qu(e, t) {
	return new Ku({
		type: "pipe",
		in: e,
		out: t
	});
}
var Ju = /*@__PURE__*/ F("ZodReadonly", (e, t) => {
	Go.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => _l(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Yu(e) {
	return new Ju({
		type: "readonly",
		innerType: e
	});
}
var Xu = /*@__PURE__*/ F("ZodCustom", (e, t) => {
	z.init(e, t), Il.init(e, t), e._zod.processJSONSchema = (t, n, r) => nl(e, t, n, r);
});
function Zu(e, t = {}) {
	return /* @__PURE__ */ gc(Xu, e, t);
}
function Qu(e, t) {
	return /* @__PURE__ */ _c(e, t);
}
//#endregion
//#region packages/domain/notification-preferences.ts
var $u = g(), ed = [
	"orderEmail",
	"promotionsEmail",
	"orderSms"
], G = U({
	orderEmail: pu(),
	promotionsEmail: pu(),
	orderSms: pu()
}).strict(), K = B().trim().max(20).transform((e) => e.replace(/\s/g, "").replace(/^0/, "+84")).refine((e) => e === "" || /^\+84[35789][0-9]{8}$/.test(e), "Số điện thoại Việt Nam chưa hợp lệ."), q = U({
	requested: pu(),
	generation: H().int().nonnegative(),
	confirmedGeneration: H().int().nonnegative().nullable()
}).strict(), J = U({
	schemaVersion: W(1),
	version: H().int().nonnegative(),
	email: B().max(254),
	phone: K,
	topics: U({
		orderEmail: q,
		promotionsEmail: q,
		orderSms: q
	}).strict(),
	updatedAt: H().int().nonnegative()
}).strict();
function Y(e) {
	return e === "orderSms" ? "sms" : "email";
}
function td(e) {
	return e.requested ? e.confirmedGeneration === e.generation ? "active" : "pending" : "off";
}
function nd(e) {
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
function rd(e, t, n, r, i) {
	if (r.orderSms && !n) throw Error("PHONE_REQUIRED");
	let a = structuredClone(e), o = e.email !== t || e.phone !== n;
	a.email = t, a.phone = n;
	for (let i of ed) {
		let s = e.topics[i], c = Y(i) === "email" ? e.email !== t : e.phone !== n;
		(s.requested !== r[i] || c) && (o = !0, a.topics[i] = {
			requested: r[i],
			generation: s.generation + 1,
			confirmedGeneration: null
		});
	}
	return o && (a.version++, a.updatedAt = i), a;
}
var id = wu("action", [
	U({ action: W("read") }).strict(),
	U({
		action: W("save"),
		operationId: ql(),
		expectedVersion: H().int().nonnegative(),
		selected: G,
		phone: K,
		source: Ou(["checkout", "profile"])
	}).strict(),
	U({
		action: W("resend"),
		operationId: ql(),
		expectedVersion: H().int().nonnegative(),
		channel: Ou(["email", "sms"])
	}).strict(),
	U({
		action: W("confirm"),
		token: B().regex(/^[a-f0-9]{64}$/)
	}).strict(),
	U({
		action: W("unsubscribe"),
		token: B().regex(/^[a-f0-9]{64}$/)
	}).strict()
]), ad = {}, od = { currentUser: { uid: "email-content-preview-only" } }, sd = new URLSearchParams(location.search), cd = sd.get("mode") || "ok", ld = sd.get("state") || "off", ud = sd.get("availability") === "ready", dd = nd("customer@example.invalid");
if (ld === "pending" || ld === "active") for (let e of ["orderEmail", "promotionsEmail"]) dd.topics[e] = {
	requested: !0,
	generation: 1,
	confirmedGeneration: ld === "active" ? 1 : null
};
ld === "partial" && (dd.topics.orderEmail = {
	requested: !0,
	generation: 1,
	confirmedGeneration: 1
});
var fd = /* @__PURE__ */ new Map(), pd = !1;
window.__emailContentFixture = {
	calls: [],
	providerIO: !1,
	accountWrites: !1
};
var md = () => ({
	...structuredClone(dd),
	availability: {
		email: ud,
		sms: !1
	}
});
async function hd(e, t) {
	if (window.__emailContentFixture.calls.push({
		name: e,
		action: t?.action,
		operationId: t?.operationId
	}), e === "purchaseCheckoutSetup") return {
		regions: [{
			code: "79",
			name: "TP. Hồ Chí Minh",
			communes: [{
				code: "7901",
				name: "Phường Bến Thành"
			}]
		}],
		shipping: null,
		shippingOrigin: "reference",
		pricing: null
	};
	if (e !== "notificationPreferences") throw Error("PREVIEW_ONLY");
	if (t.action === "read") {
		if (cd === "loading" && await new Promise(() => {}), cd === "loadfail" && !pd) throw pd = !0, Error("Fixture load failure");
		return md();
	}
	if (t.action === "confirm" || t.action === "unsubscribe") {
		if (cd === "tokenfail") throw Error("Fixture invalid token");
		return { status: t.action === "confirm" ? "confirmed" : "unsubscribed" };
	}
	if (t.action === "resend") {
		if (cd === "quota") throw Object.assign(Error("Fixture quota"), { code: "functions/resource-exhausted" });
		return md();
	}
	if (t.action === "save") {
		if (fd.has(t.operationId)) return md();
		if (cd === "savepending" && await new Promise(() => {}), cd === "conflict") throw Object.assign(Error("Fixture version conflict"), { code: "functions/aborted" });
		if (cd === "unauthorized") throw Object.assign(Error("Fixture permission"), { code: "functions/permission-denied" });
		if (dd = rd(dd, dd.email, t.phone, t.selected, Date.now()), fd.set(t.operationId, !0), cd === "uncertain" && !pd) throw pd = !0, Error("Fixture lost response");
		return md();
	}
	throw Error("PREVIEW_ONLY");
}
//#endregion
//#region src/features/notifications/subscription-state.ts
var gd = J.extend({ availability: U({
	email: pu(),
	sms: pu()
}).strict() });
function _d(e) {
	return G.parse(Object.fromEntries(Object.entries(e.topics).map(([e, t]) => [e, t.requested])));
}
//#endregion
//#region src/features/notifications/use-notification-preferences.ts
var vd = {
	orderEmail: !1,
	promotionsEmail: !1,
	orderSms: !1
};
function yd(e, t) {
	let n = e?.uid ?? "", r = (0, _.useRef)(n);
	r.current = n;
	let i = (0, _.useRef)(0), a = (0, _.useRef)(!1), o = (0, _.useRef)(null), [s, c] = (0, _.useState)({
		owner: n,
		view: null,
		selected: vd,
		phone: "",
		error: "",
		busy: !1,
		message: "",
		uncertain: !1
	}), l = s.owner === n ? s : {
		owner: n,
		view: null,
		selected: vd,
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
			let t = gd.parse(await hd("notificationPreferences", { action: "read" }));
			e === i.current && r.current === n && c({
				owner: n,
				view: t,
				selected: _d(t),
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
		selected: vd,
		phone: "",
		error: "",
		busy: !1,
		message: "",
		uncertain: !1
	}), u(), () => {
		i.current++;
	}), [n, u]);
	let d = !!l.view && (l.phone !== l.view.phone || Object.keys(vd).some((e) => l.selected[e] !== l.view.topics[e].requested));
	async function f(e) {
		if (!n || od?.currentUser?.uid !== n || !l.view || a.current) return;
		let s = i.current;
		if (!o.current) {
			if (!e && !d) return;
			let n = K.safeParse(l.phone);
			if (!e && (!n.success || l.selected.orderSms && !n.data)) {
				c((e) => ({
					...e,
					error: "Nhập số di động của bạn để nhận SMS."
				}));
				return;
			}
			o.current = id.parse(e ? {
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
		let f = () => r.current === n && i.current === s && od?.currentUser?.uid === n;
		try {
			let e = gd.parse(await hd("notificationPreferences", u));
			if (!f()) return;
			o.current = null, c({
				owner: n,
				view: e,
				selected: _d(e),
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
var bd = /* @__PURE__ */ o(((e) => {
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
	t.exports = bd();
})))(), xd = {
	orderEmail: "Cập nhật đơn hàng qua email",
	promotionsEmail: "Ưu đãi qua email",
	orderSms: "Cập nhật đơn hàng qua SMS"
};
function Sd({ controller: e }) {
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
function Cd({ controller: e }) {
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
		}), /* @__PURE__ */ (0, X.jsx)(Sd, { controller: e })] })
	});
}
function wd({ user: e, blocked: t = !1, onPendingChange: n }) {
	let r = yd(e, "profile"), i = (0, _.useId)();
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
							let t = e === "orderSms" ? "sms" : "email", n = r.view.availability[t], a = td(r.view.topics[e]);
							return /* @__PURE__ */ (0, X.jsxs)("div", {
								className: "subscriptionRow",
								children: [/* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("label", {
									htmlFor: `${i}-${e}`,
									children: xd[e]
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
						["email", "sms"].map((e) => r.view.availability[e] && Object.entries(r.view.topics).some(([t, n]) => (t === "orderSms" ? "sms" : "email") === e && td(n) === "pending") && /* @__PURE__ */ (0, X.jsxs)("button", {
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
			/* @__PURE__ */ (0, X.jsx)(Sd, { controller: r })
		]
	});
}
function Td() {
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
				await hd("notificationPreferences", e), i(e.action === "confirm" ? "Đã xác nhận đăng ký nhận tin." : "Đã tắt loại tin trong liên kết này.");
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
//#region \0emailFixtureFirestore
var Ed = (e, ...t) => ({ path: t.join("/") }), Dd = (e, t) => ({ path: t }), Od = () => ({}), kd = () => ({}), Ad = (...e) => e[0], jd = async () => ({ docs: [] }), Md = (e, t) => (t(e.path?.startsWith("users/") ? { data: () => ({
	displayName: "Khách hàng minh họa",
	businessName: "",
	marketingConsent: !1,
	version: 1
}) } : { docs: [] }), () => {}), Nd = () => ({
	cart: {
		revision: 1,
		items: [{ kind: "catalog" }]
	},
	loading: !1,
	cached: !1,
	refresh: () => {}
}), Pd = /* @__PURE__ */ new Set(), Fd = 0, Id = 0;
function Ld({ overlay: e = !0 } = {}) {
	Fd++, e && Id++, Pd.forEach((e) => e());
	let t = !1;
	return () => {
		t || (t = !0, Fd--, e && Id--, Pd.forEach((e) => e()));
	};
}
var Rd = 0, zd = /* @__PURE__ */ new Set();
function Bd(e, t = "info") {
	++Rd, zd.forEach((e) => e());
}
//#endregion
//#region src/shared/Loading.tsx
function Vd() {
	return /* @__PURE__ */ (0, X.jsx)("span", {
		className: "loadingBar",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, X.jsx)("span", {})
	});
}
function Hd({ children: e, className: t = "", overlay: n = !1, variant: r = "inline" }) {
	return (0, _.useEffect)(() => n ? Ld() : void 0, [n]), r === "overlay" ? /* @__PURE__ */ (0, X.jsx)("div", {
		className: `loadingOverlay ${t}`,
		children: /* @__PURE__ */ (0, X.jsxs)("div", {
			className: "loadingOverlayCard",
			role: "status",
			"aria-live": "polite",
			"aria-atomic": "true",
			"aria-busy": "true",
			children: [/* @__PURE__ */ (0, X.jsx)(Vd, {}), /* @__PURE__ */ (0, X.jsx)("div", { children: e })]
		})
	}) : /* @__PURE__ */ (0, X.jsxs)("div", {
		className: `loadingState loadingState--${r} ${t}`,
		role: "status",
		"aria-busy": "true",
		children: [/* @__PURE__ */ (0, X.jsx)(Vd, {}), /* @__PURE__ */ (0, X.jsx)("div", { children: e })]
	});
}
//#endregion
//#region packages/domain/index.ts
var Ud = H().int().nonnegative().max(0xe8d4a51000), Wd = Ou([
	"US",
	"JP",
	"KR"
]), Gd = U({
	name: B().trim().min(2).max(200),
	url: B().url().max(2048).refine((e) => /^https?:\/\//i.test(e)).optional().or(W("")),
	quantity: H().int().min(1).max(100),
	variant: B().max(200).default(""),
	condition: Ou([
		"new",
		"used",
		"any"
	]).optional(),
	unitSourceMinor: Ud.positive().optional()
}).strict(), Kd = U({
	market: Wd,
	items: yu(Gd).min(1).max(30),
	notes: B().max(2e3).default(""),
	preferredStore: B().max(160).optional(),
	budget: Ud.optional(),
	desiredAt: H().int().positive().optional()
}).strict();
U({
	goods: Ud,
	service: Ud,
	sourceCosts: Ud,
	internationalShipping: Ud,
	destinationShipping: Ud,
	discount: Ud,
	sourceCurrency: Ou([
		"USD",
		"JPY",
		"KRW"
	]),
	sourceMinor: Ud,
	fxNumerator: H().int().positive().max(1e9),
	fxDenominator: H().int().positive().max(1e9),
	termsVersion: B().min(1).max(80),
	expiresAt: H().int().positive(),
	verifiedProduct: B().min(2).max(1e3)
}).strict(), yu(U({
	line: H().int().min(0).max(29),
	quantity: H().int().positive().max(100)
}).strict()).min(1).max(30);
//#endregion
//#region packages/domain/catalog-checkout.ts
var qd = yu(B().trim().min(1).max(200)).max(30).refine((e) => new Set(e).size === e.length);
U({
	title: B().trim().min(2).max(160),
	slug: B().regex(/^[a-z0-9-]{2,100}$/),
	status: W("published"),
	market: Wd,
	version: H().int().positive(),
	orderable: W(!0),
	listedPrice: Ud.positive(),
	termsVersion: B().trim().min(1).max(80),
	catalogOptions: qd.default([]),
	variants: B().max(500).optional(),
	referenceUrl: B().url().refine((e) => /^https?:\/\//i.test(e)).optional()
}).refine((e) => !e.variants?.trim() || e.catalogOptions.length > 0);
var Jd = yu(U({
	productId: B().regex(/^[a-zA-Z0-9-]{1,80}$/),
	productVersion: H().int().positive(),
	quantity: H().int().min(1).max(100),
	variant: B().trim().max(200).default("")
}).strict().pick({
	productId: !0,
	variant: !0,
	quantity: !0
}).extend({
	lineId: B().uuid(),
	kind: W("custom").optional(),
	custom: U({
		draftId: B().uuid(),
		itemIndex: H().int().min(0).max(29),
		name: B().min(2).max(200),
		market: Ou([
			"US",
			"JP",
			"KR"
		]),
		unitSourceMinor: H().int().positive().max(0xe8d4a51000),
		fxNumerator: H().int().positive().max(1e9),
		fxDenominator: H().int().positive().max(1e9),
		serviceBps: H().int().min(0).max(1e4)
	}).strict().optional()
}).strict().refine((e) => e.kind === "custom" == !!e.custom)).max(30).refine((e) => new Set(e.map(Yd)).size === e.length && new Set(e.map((e) => e.lineId)).size === e.length);
U({
	ownerId: B().min(1),
	revision: H().int().nonnegative(),
	updatedAt: H().int().nonnegative(),
	items: Jd,
	activeCheckoutId: B().uuid().nullable().optional()
});
function Yd(e) {
	return e.kind === "custom" ? JSON.stringify(["custom", e.lineId]) : JSON.stringify([e.productId, e.variant]);
}
var Xd = {
	operationId: B().uuid(),
	expectedRevision: H().int().nonnegative()
};
wu("action", [
	U({
		action: W("merge"),
		...Xd,
		items: Jd.min(1)
	}).strict(),
	U({
		action: W("quantity"),
		...Xd,
		lineId: B().uuid(),
		quantity: H().int().min(1).max(100)
	}).strict(),
	U({
		action: W("remove"),
		...Xd,
		lineId: B().uuid()
	}).strict(),
	U({
		action: W("consume"),
		operationId: B().uuid(),
		orderId: B().uuid(),
		lineId: B().uuid()
	}).strict()
]), Kd.extend({ items: yu(Gd.extend({ unitSourceMinor: Ud.positive() })).min(1).max(30) }).strict();
var Zd = U({
	recipient: B().trim().min(2).max(120),
	phone: B().trim().regex(/^(?:\+84|0)[0-9]{9,10}$/),
	country: W("VN"),
	provinceCode: B().regex(/^[0-9]{2}$/),
	communeCode: B().regex(/^[0-9]{5}$/),
	province: B().trim().min(2).max(120),
	commune: B().trim().min(2).max(120),
	street: B().trim().min(5).max(300),
	note: B().trim().max(500).default("")
}).strict();
U({
	enabled: W(!0),
	approved: W(!0),
	version: H().int().positive(),
	serviceBps: H().int().min(0).max(1e4),
	termsVersion: B().min(1).max(80),
	effectiveFrom: H().int().nonnegative(),
	expiresAt: H().int().positive(),
	rates: U({
		USD: U({
			numerator: H().int().positive().max(1e9),
			denominator: H().int().positive().max(1e9)
		}),
		JPY: U({
			numerator: H().int().positive().max(1e9),
			denominator: H().int().positive().max(1e9)
		}),
		KRW: U({
			numerator: H().int().positive().max(1e9),
			denominator: H().int().positive().max(1e9)
		})
	})
}).strict();
var Qd = U({
	id: B().uuid(),
	state: W("pending"),
	total: Ud.positive(),
	provider: Ou(["demo", "sepay_sandbox"]),
	paymentMethod: W("BANK_TRANSFER").optional()
});
U({
	id: B().uuid(),
	version: H().int().positive().safe()
}), U({
	orderId: B().uuid(),
	expectedVersion: H().int().positive().safe()
});
function $d(e, t, n) {
	let r = Qd.parse(e);
	if (n && r.paymentMethod !== n || r.provider === "sepay_sandbox" && r.paymentMethod !== "BANK_TRANSFER" || r.id !== t) throw Error("INVALID_CHECKOUT_ACKNOWLEDGEMENT");
	return r;
}
//#endregion
//#region src/features/cart/purchase-thumbnail.tsx
var ef = (e) => `/media/${encodeURIComponent(e)}`;
function tf({ draftId: e, itemIndex: t, mediaId: n }) {
	let [r, i] = (0, _.useState)(null);
	(0, _.useEffect)(() => {
		let n = !0;
		return i(null), e && t !== void 0 && hd("purchaseDraftImage", {
			action: "read",
			draftId: e,
			itemIndex: t
		}).then((e) => {
			n && e.mime && e.base64 && i(`data:${e.mime};base64,${e.base64}`);
		}).catch(() => {}), () => {
			n = !1;
		};
	}, [e, t]);
	let a = n ? ef(n) : r;
	return /* @__PURE__ */ (0, X.jsxs)("span", {
		className: "purchaseThumbnail",
		"aria-hidden": "true",
		children: ["▧", a && /* @__PURE__ */ (0, X.jsx)("img", {
			src: a,
			alt: "",
			width: 44,
			height: 44,
			onError: (e) => {
				e.currentTarget.hidden = !0;
			}
		})]
	});
}
//#endregion
//#region src/features/cart/purchase-sign-in-assets/google-g.png
var nf = "data:image/png;base64,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";
//#endregion
//#region src/features/cart/purchase-sign-in.tsx
function rf({ signIn: e }) {
	return /* @__PURE__ */ (0, X.jsxs)("button", {
		className: "purchaseGoogleSignIn",
		type: "button",
		onClick: e,
		children: [/* @__PURE__ */ (0, X.jsx)("img", {
			src: nf,
			width: "20",
			height: "20",
			alt: ""
		}), /* @__PURE__ */ (0, X.jsx)("span", { children: "Đăng nhập với Google" })]
	});
}
//#endregion
//#region src/features/cart/purchase-feedback.ts
function af(e, t) {
	let n = e;
	return [
		"functions/deadline-exceeded",
		"functions/unavailable",
		"functions/internal",
		"functions/cancelled",
		"auth/network-request-failed"
	].includes(String(n?.code)) || typeof n?.message != "string" || !n.message.trim() || /^(?:deadline-exceeded|unavailable|internal|INTERNAL)$/.test(n.message) ? t : n.message;
}
//#endregion
//#region src/features/cart/purchase-payment-methods.tsx
var of = [
	{
		value: "BANK_TRANSFER",
		label: "QR chuyển khoản ngân hàng",
		description: "Quét mã bằng ứng dụng ngân hàng."
	},
	{
		value: "NAPAS_BANK_TRANSFER",
		label: "QR NAPAS chuyển khoản",
		description: ""
	},
	{
		value: "CARD",
		label: "Thẻ ngân hàng",
		description: "Visa, Mastercard, JCB"
	}
];
function sf({ method: e }) {
	return /* @__PURE__ */ (0, X.jsx)("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.5",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		focusable: "false",
		children: e === "BANK_TRANSFER" ? /* @__PURE__ */ (0, X.jsx)("path", { d: "m3 8 9-5 9 5M4 9h16M4 20h16M7 12v5m5-5v5m5-5v5" }) : e === "NAPAS_BANK_TRANSFER" ? /* @__PURE__ */ (0, X.jsx)("path", { d: "M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6v-3m6-3v-3h-3m-6 0v3" }) : /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [/* @__PURE__ */ (0, X.jsx)("rect", {
			x: "2",
			y: "5",
			width: "20",
			height: "14",
			rx: "3"
		}), /* @__PURE__ */ (0, X.jsx)("path", { d: "M2 10h20M6 15h4" })] })
	});
}
function cf({ value: e, enabledMethods: t, onChange: n, disabled: r = !1 }) {
	let i = (0, _.useId)();
	return /* @__PURE__ */ (0, X.jsxs)("fieldset", {
		className: "purchaseMethods",
		disabled: r,
		children: [
			/* @__PURE__ */ (0, X.jsx)("legend", { children: "Phương thức thanh toán" }),
			/* @__PURE__ */ (0, X.jsx)("div", {
				className: "purchaseMethodOptions",
				children: of.map((a) => {
					let o = a.value === "BANK_TRANSFER" && t.includes(a.value), s = o && e === a.value, c = `${i}-${a.value}-description`;
					return /* @__PURE__ */ (0, X.jsxs)("label", {
						className: `purchaseMethod purchaseMethod--${a.value.toLowerCase()}${s ? " isSelected" : ""}${o ? "" : " isUnavailable"}`,
						children: [
							/* @__PURE__ */ (0, X.jsx)("span", {
								className: "purchaseMethodIcon",
								children: /* @__PURE__ */ (0, X.jsx)(sf, { method: a.value })
							}),
							/* @__PURE__ */ (0, X.jsxs)("span", {
								className: "purchaseMethodCopy",
								children: [/* @__PURE__ */ (0, X.jsx)("span", {
									className: "purchaseMethodLabel",
									children: a.label
								}), /* @__PURE__ */ (0, X.jsxs)("span", {
									id: c,
									className: "purchaseMethodDescription",
									children: [
										a.description,
										a.description && !o ? " · " : "",
										!o && "Chưa khả dụng"
									]
								})]
							}),
							/* @__PURE__ */ (0, X.jsx)("input", {
								type: "radio",
								name: `${i}-payment-method`,
								value: a.value,
								"aria-label": a.label,
								"aria-describedby": c,
								checked: s,
								disabled: !o,
								onChange: () => {
									o && !r && n(a.value);
								}
							})
						]
					}, a.value);
				})
			}),
			!t.includes("BANK_TRANSFER") && /* @__PURE__ */ (0, X.jsx)("p", {
				className: "purchaseMethodNotice",
				role: "status",
				children: "Chưa có phương thức thanh toán khả dụng. Tải lại thông tin để kiểm tra."
			})
		]
	});
}
//#endregion
//#region src/features/cart/purchase-region-search.ts
function lf(e) {
	return e.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLocaleLowerCase("vi-VN").replace(/[^a-z0-9]+/g, " ").trim();
}
function uf(e) {
	return e.map((e) => {
		let t = lf(e.name), n = t.match(/^(thanh pho|tinh|phuong|xa|dac khu) /)?.[1], r = n ? t.slice(n.length + 1) : t, i = r.split(" ").map((e) => e[0]).join(""), a = n?.split(" ").map((e) => e[0]).join("") ?? "";
		return {
			option: e,
			search: `${t} ${e.code} ${r.replace(/ /g, "")} ${i} ${a} ${a}${i}`
		};
	});
}
function df(e, t) {
	let n = lf(t).split(" ").filter(Boolean);
	return e.filter(({ search: e }) => n.every((t) => e.includes(t))).map(({ option: e }) => e);
}
function ff(e, t) {
	let n = e.find((e) => e.code === t);
	return {
		provinceCode: n?.code ?? "",
		province: n?.name ?? "",
		communeCode: "",
		commune: ""
	};
}
function pf(e, t, n) {
	return n ? e === "Home" ? 0 : e === "End" ? n - 1 : e === "ArrowDown" ? Math.min(t + 1, n - 1) : e === "ArrowUp" ? t < 0 ? n - 1 : Math.max(t - 1, 0) : t : -1;
}
//#endregion
//#region src/features/cart/purchase-region-autocomplete.tsx
function Z({ options: e, value: t, placeholder: n, disabled: r = !1, onSelect: i, ...a }) {
	let [o, s] = (0, _.useState)(null), [c, l] = (0, _.useState)(!1), [u, d] = (0, _.useState)(-1), f = (0, _.useRef)(null), p = (0, _.useRef)(null), m = (0, _.useRef)(!1), h = e.find((e) => e.code === t), g = o?.forValue === t ? o.text : "", v = (0, _.useMemo)(() => uf(e), [e]), y = (0, _.useMemo)(() => df(v, g), [v, g]), b = c && !r, x = `${a.id}-options`, S = b ? y[u] : void 0;
	(0, _.useEffect)(() => {
		let e = p.current, t = e?.children[u];
		b && e && t && (t.offsetTop < e.scrollTop ? e.scrollTop = t.offsetTop : t.offsetTop + t.offsetHeight > e.scrollTop + e.clientHeight && (e.scrollTop = t.offsetTop + t.offsetHeight - e.clientHeight));
	}, [
		u,
		b,
		y
	]);
	function C(e) {
		r || f.current?.matches(":disabled") || (e.code !== t && i(e), s(null), l(!1), d(-1));
	}
	return /* @__PURE__ */ (0, X.jsxs)("div", {
		className: "purchaseRegionAutocomplete",
		children: [
			/* @__PURE__ */ (0, X.jsx)("input", {
				...a,
				ref: f,
				type: "text",
				role: "combobox",
				required: !0,
				disabled: r,
				autoComplete: "off",
				spellCheck: !1,
				maxLength: 120,
				placeholder: n,
				value: o?.forValue === t ? o.text : h?.name ?? "",
				"aria-autocomplete": "list",
				"aria-expanded": b,
				"aria-controls": b ? x : void 0,
				"aria-activedescendant": S ? `${x}-${S.code}` : void 0,
				onFocus: () => l(!0),
				onClick: () => l(!0),
				onChange: (e) => {
					s({
						text: e.target.value,
						forValue: ""
					}), l(!0), d(0), t && i(null);
				},
				onBlur: () => {
					l(!1), d(-1);
				},
				onCompositionStart: () => {
					m.current = !0;
				},
				onCompositionEnd: () => {
					m.current = !1;
				},
				onKeyDown: (e) => {
					m.current || e.nativeEvent.isComposing || e.keyCode === 229 || (["ArrowDown", "ArrowUp"].includes(e.key) || b && ["Home", "End"].includes(e.key) ? (e.preventDefault(), l(!0), d(pf(e.key, b ? u : -1, y.length))) : e.key === "Enter" && b ? (e.preventDefault(), S ? C(S) : l(!1)) : e.key === "Escape" && b && (e.preventDefault(), e.stopPropagation(), l(!1), d(-1)));
				}
			}),
			/* @__PURE__ */ (0, X.jsx)("span", {
				className: "purchaseRegionChevron",
				"aria-hidden": "true",
				children: "⌄"
			}),
			b && /* @__PURE__ */ (0, X.jsxs)("ul", {
				ref: p,
				id: x,
				className: "purchaseRegionOptions",
				role: "listbox",
				"aria-labelledby": a["aria-labelledby"],
				children: [y.map((e, n) => /* @__PURE__ */ (0, X.jsxs)("li", {
					id: `${x}-${e.code}`,
					role: "option",
					"aria-selected": e.code === t,
					className: n === u ? "isActive" : void 0,
					onPointerDown: (e) => e.preventDefault(),
					onClick: () => C(e),
					children: [/* @__PURE__ */ (0, X.jsx)("span", { children: e.name }), e.code === t && /* @__PURE__ */ (0, X.jsx)("span", {
						"aria-hidden": "true",
						children: "✓"
					})]
				}, e.code)), !y.length && /* @__PURE__ */ (0, X.jsx)("li", {
					className: "purchaseRegionEmpty",
					role: "presentation",
					children: "Không tìm thấy. Thử tên khác hoặc gõ không dấu."
				})]
			}),
			/* @__PURE__ */ (0, X.jsx)("span", {
				className: "purchaseRegionStatus",
				role: "status",
				"aria-live": "polite",
				"aria-atomic": "true",
				children: b ? y.length ? `${y.length} kết quả. Dùng phím mũi tên và Enter để chọn.` : "Không tìm thấy địa danh phù hợp." : ""
			})
		]
	});
}
//#endregion
//#region src/features/cart/purchase-payment-selection.ts
function mf(e) {
	if (!e || typeof e != "object") return [];
	let t = e;
	return (t.provider === "demo" || t.provider === "sepay_sandbox") && t.methods?.BANK_TRANSFER?.available === !0 ? ["BANK_TRANSFER"] : [];
}
function hf(e) {
	return e === "BANK_TRANSFER" || e === "NAPAS_BANK_TRANSFER" || e === "CARD";
}
//#endregion
//#region src/features/cart/purchase-recipient-validation.ts
var gf = [
	"recipient",
	"phone",
	"provinceCode",
	"communeCode",
	"street",
	"note"
], _f = {
	recipient: "Nhập tên người nhận (ít nhất 2 ký tự).",
	phone: "Nhập số điện thoại Việt Nam hợp lệ.",
	provinceCode: "Chọn tỉnh / thành phố.",
	communeCode: "Chọn phường / xã.",
	street: "Nhập địa chỉ cụ thể (ít nhất 5 ký tự).",
	note: "Ghi chú tối đa 500 ký tự."
};
function vf(e) {
	let t = Zd.safeParse(e), n = {};
	if (!t.success) for (let e of t.error.issues) {
		let t = e.path[0], r = gf.find((e) => e === t || e === "provinceCode" && t === "province" || e === "communeCode" && t === "commune");
		r && (n[r] = _f[r]);
	}
	return {
		parsed: t,
		errors: n
	};
}
//#endregion
//#region src/features/cart/purchase-checkout.tsx
var yf = (e) => `${e.toLocaleString("vi-VN")} ₫`, bf = {
	recipient: "",
	phone: "",
	country: "VN",
	provinceCode: "",
	communeCode: "",
	province: "",
	commune: "",
	street: "",
	note: ""
};
function xf({ current: e }) {
	return /* @__PURE__ */ (0, X.jsx)("nav", {
		className: "purchaseSteps",
		"aria-label": "Các bước hoàn tất đơn",
		children: [
			"Nhận hàng",
			"Tổng quan",
			"Thanh toán"
		].map((t, n) => /* @__PURE__ */ (0, X.jsxs)("div", {
			className: n + 1 === e ? "isCurrent" : n + 1 < e ? "isComplete" : "",
			"aria-current": n + 1 === e ? "step" : void 0,
			children: [/* @__PURE__ */ (0, X.jsx)("span", {
				"aria-hidden": "true",
				children: n + 1 < e ? "✓" : n + 1
			}), /* @__PURE__ */ (0, X.jsx)("span", { children: t })]
		}, t))
	});
}
function Sf({ user: e, signIn: t }) {
	let { cart: n, loading: r, cached: i, refresh: a } = Nd(), o = dt(), [s] = Tn(), c = s.get("order"), l = !!c, [u, d] = (0, _.useState)(null), [f, p] = (0, _.useState)(bf), [m, h] = (0, _.useState)([]), [g, v] = (0, _.useState)(""), [y, b] = (0, _.useState)(0), [x, S] = (0, _.useState)(l ? 2 : 1), [C, w] = (0, _.useState)(null), [T, E] = (0, _.useState)(!1), [D, ee] = (0, _.useState)(!1), [te, ne] = (0, _.useState)(""), [re, ie] = (0, _.useState)(!1), [ae, oe] = (0, _.useState)(null), se = mf(u?.paymentCapabilities), ce = yd(e, "checkout"), [le, ue] = (0, _.useState)("texas_cali"), [de, fe] = (0, _.useState)(""), [pe, me] = (0, _.useState)(""), he = (0, _.useRef)(null), ge = (0, _.useRef)(null), _e = (0, _.useRef)(!1), ve = (0, _.useRef)(null), ye = (0, _.useRef)(0), be = `purchase-commit:${e?.uid ?? "guest"}:${l ? `balance-${c}` : "initial"}`, xe = re ? vf(f).errors : {};
	function Se(e) {
		return {
			id: `purchase-${e}`,
			name: e,
			"aria-labelledby": `purchase-${e}-label`,
			"aria-invalid": !!xe[e],
			"aria-describedby": xe[e] ? `purchase-${e}-error` : void 0
		};
	}
	function O(e) {
		return /* @__PURE__ */ (0, X.jsx)("span", {
			className: "purchaseFieldError",
			id: `purchase-${e}-error`,
			children: xe[e]
		});
	}
	(0, _.useEffect)(() => {
		let t = !0;
		if (ve.current = null, w(null), E(!1), S(l ? 2 : 1), ie(!1), d(null), oe(null), e) {
			hd("purchaseCheckoutSetup", {}).then((e) => {
				t && (d(e), oe(mf(e.paymentCapabilities)[0] ?? null));
			}).catch((e) => {
				t && ne(af(e, "Chưa tải được thông tin mua hàng. Kiểm tra kết nối rồi thử lại."));
			}), ad && jd(Ad(Dd(ad, "addresses"), Od("ownerId", "==", e.uid), kd(20))).then((e) => {
				t && h(e.docs.map((e) => ({
					id: e.id,
					...e.data()
				})));
			}).catch(() => {
				t && ne("Chưa tải được địa chỉ đã lưu. Bạn vẫn có thể nhập địa chỉ mới.");
			});
			try {
				let e = JSON.parse(sessionStorage.getItem(be) ?? "null");
				e?.action === "commit" && /^[0-9a-f-]{36}$/i.test(e.operationId) && /^[0-9a-f-]{36}$/i.test(e.previewId) && /^[a-f0-9]{64}$/.test(e.previewHash) && e.confirmed === !0 && (e.paymentMethod === void 0 || hf(e.paymentMethod)) && (ve.current = e, ne("Có lần gửi thanh toán chưa rõ kết quả. Kiểm tra lại cùng lần đã gửi để tránh trùng."));
			} catch {
				ne("Chưa đọc được lần gửi trước. Kiểm tra giỏ và lịch sử đơn trước khi tiếp tục.");
			}
			return () => {
				t = !1, ye.current++;
			};
		}
	}, [e?.uid, be]), (0, _.useEffect)(() => {
		!l && n.activeCheckoutId && o(`/checkout/payment/${n.activeCheckoutId}`, { replace: !0 });
	}, [
		n.activeCheckoutId,
		o,
		l
	]), (0, _.useEffect)(() => {
		C && !l && C.cartRevision !== n.revision && (w(null), E(!1), S(1), ne("Giỏ đã đổi. Xem lại tổng quan trước khi thanh toán."));
	}, [
		n.revision,
		C,
		l
	]), (0, _.useEffect)(() => {
		if (!l || !e) return;
		let t = !0;
		return hd("purchaseOrderRead", { orderId: c }).then((e) => t ? e.balanceCheckoutId ? (o(`/checkout/payment/${e.balanceCheckoutId}`, { replace: !0 }), null) : hd("purchaseBalanceCheckout", {
			action: "preview",
			orderId: c,
			expectedVersion: e.version,
			operationId: crypto.randomUUID()
		}) : null).then((e) => {
			t && e && (ce.dirty && ce.save(), w(e), p(e.recipient));
		}).catch((e) => {
			t && ne(af(e, "Chưa mở được khoản cần thanh toán thêm. Kiểm tra kết nối rồi thử lại."));
		}), () => {
			t = !1;
		};
	}, [
		l,
		c,
		e?.uid,
		o
	]);
	function k(e) {
		p((t) => ({
			...t,
			...e
		})), v(""), E(!1), w(null);
	}
	function Ce() {
		if (!pe.trim()) return;
		if (!/^\d+(?:[.,]\d{1,3})?$/.test(pe) || !de) throw Error("Chọn loại hàng và nhập cân nặng hợp lệ, hoặc để trống để chốt cước sau.");
		let e = Number(pe.replace(",", ".")) * 1e3;
		if (!Number.isSafeInteger(e) || e <= 0 || e > 1e9) throw Error("Cân nặng cần lớn hơn 0, tối đa 3 số lẻ.");
		return {
			direction: "US_VN",
			warehouse: le,
			service: u?.shipping?.rows.find((e) => e.id === de && e.warehouse === le && e.direction === "US_VN")?.service ?? "cargo",
			rowId: de,
			weightGrams: e
		};
	}
	async function we() {
		if (_e.current || !e) return;
		ne("");
		let { parsed: t, errors: r } = vf(f);
		if (ie(!0), !t.success) {
			let e = gf.find((e) => r[e]);
			ge.current?.querySelector(`[name="${e}"]:not(:disabled)`)?.focus({ preventScroll: !0 });
			return;
		}
		let i;
		try {
			i = Ce();
		} catch (e) {
			ne(e.message);
			return;
		}
		_e.current = !0, ee(!0);
		let a = ++ye.current;
		try {
			let e = await hd("purchaseCheckout", {
				action: "preview",
				operationId: crypto.randomUUID(),
				expectedRevision: n.revision,
				recipient: t.data,
				...i ? { shipping: i } : {}
			});
			if (a !== ye.current) return;
			w(e), p(e.recipient), E(!1), S(2), requestAnimationFrame(() => he.current?.focus());
		} catch (e) {
			a === ye.current && ne(af(e, "Chưa tải được tổng quan. Thông tin nhận hàng vẫn được giữ; kiểm tra kết nối rồi thử lại."));
		} finally {
			_e.current = !1, ee(!1);
		}
	}
	async function Te() {
		if (_e.current || !e || !ve.current && (!C || !T || !ae || !se.includes(ae))) return;
		ne("");
		let t = ve.current ?? {
			action: "commit",
			operationId: crypto.randomUUID(),
			previewId: C.id,
			previewHash: C.previewHash,
			confirmed: !0,
			paymentMethod: ae
		};
		try {
			sessionStorage.setItem(be, JSON.stringify(t));
		} catch {
			ne("Trình duyệt chưa lưu được lần gửi để kiểm tra lại an toàn. Cho phép lưu phiên rồi thử lại.");
			return;
		}
		ve.current = t, _e.current = !0, ee(!0);
		let n = ye.current;
		try {
			let e = $d(await hd(l ? "purchaseBalanceCheckout" : "purchaseCheckout", t), t.previewId, t.paymentMethod);
			if (n !== ye.current || (sessionStorage.removeItem(be), ve.current = null, await a(), n !== ye.current)) return;
			o(`/checkout/payment/${e.id}`);
		} catch (e) {
			if (n !== ye.current) return;
			let t = e.code ?? "";
			[
				"functions/aborted",
				"functions/failed-precondition",
				"functions/permission-denied",
				"functions/invalid-argument",
				"functions/already-exists"
			].includes(t) ? (sessionStorage.removeItem(be), ve.current = null, E(!1), w(null), l || S(1), ne(af(e, "Chưa xác nhận được thông tin. Xem lại tổng quan trước khi thanh toán."))) : ne("Chưa rõ kết quả. Kiểm tra lại cùng lần đã gửi; không tạo thanh toán mới.");
		} finally {
			_e.current = !1, n === ye.current && ee(!1);
		}
	}
	let Ee = u?.regions.find((e) => e.code === f.provinceCode), A = u?.shipping?.rows.filter((e) => e.direction === "US_VN" && e.warehouse === le) ?? [];
	return e ? /* @__PURE__ */ (0, X.jsxs)("section", {
		className: "page purchaseCheckout",
		children: [
			/* @__PURE__ */ (0, X.jsx)(yn, {
				className: "purchaseBack",
				to: l ? `/account/orders/${c}` : "/cart",
				children: l ? "← Đơn hàng" : "← Giỏ hàng"
			}),
			/* @__PURE__ */ (0, X.jsxs)("header", {
				className: "purchaseHeader",
				children: [/* @__PURE__ */ (0, X.jsx)("h1", {
					ref: he,
					tabIndex: -1,
					children: l ? "Duyệt khoản trả thêm" : x === 1 ? "Thông tin nhận hàng" : "Tổng quan đơn hàng"
				}), /* @__PURE__ */ (0, X.jsx)("p", { children: x === 1 ? "Nhập địa chỉ nhận hàng, rồi xem tổng quan trước khi thanh toán." : "Kiểm tra món, địa chỉ, cước và số tiền. Xác nhận thông tin để chuyển sang thanh toán." })]
			}),
			/* @__PURE__ */ (0, X.jsx)(xf, { current: x }),
			!l && /* @__PURE__ */ (0, X.jsx)(Sd, { controller: ce }),
			te && /* @__PURE__ */ (0, X.jsxs)("div", {
				className: "purchaseError",
				role: "alert",
				children: [/* @__PURE__ */ (0, X.jsx)("p", { children: te }), ve.current && /* @__PURE__ */ (0, X.jsx)("button", {
					disabled: D,
					onClick: () => void Te(),
					children: "Kiểm tra lần đã gửi"
				})]
			}),
			r || !u && !te || l && !C && !te ? /* @__PURE__ */ (0, X.jsx)(Hd, { children: "Đang tải thông tin đơn mua…" }) : !l && !n.items.length ? /* @__PURE__ */ (0, X.jsxs)("p", { children: [
				"Giỏ chưa có món. ",
				/* @__PURE__ */ (0, X.jsx)(yn, {
					to: "/products",
					children: "Chọn sản phẩm"
				}),
				" hoặc",
				" ",
				/* @__PURE__ */ (0, X.jsx)(yn, {
					to: "/request",
					children: "thêm món cần mua hộ"
				}),
				"."
			] }) : l && !C ? /* @__PURE__ */ (0, X.jsxs)("p", { children: [
				"Chưa tải được khoản trả thêm.",
				" ",
				/* @__PURE__ */ (0, X.jsx)("button", {
					onClick: () => window.location.reload(),
					children: "Tải lại"
				})
			] }) : /* @__PURE__ */ (0, X.jsxs)("div", {
				className: "purchaseGrid",
				children: [x === 1 ? /* @__PURE__ */ (0, X.jsxs)("form", {
					id: "purchaseRecipientForm",
					ref: ge,
					className: "purchaseCard recipientForm",
					onSubmit: (e) => {
						e.preventDefault(), we();
					},
					noValidate: !0,
					children: [
						/* @__PURE__ */ (0, X.jsx)("h2", { children: "Một địa chỉ cho các món đã chọn" }),
						/* @__PURE__ */ (0, X.jsxs)("label", { children: ["Địa chỉ đã lưu", /* @__PURE__ */ (0, X.jsxs)("select", {
							value: g,
							disabled: D || !!ve.current,
							onChange: (e) => {
								v(e.target.value), b((e) => e + 1), ie(!1);
								let t = m.find((t) => t.id === e.target.value);
								p(t ? {
									...bf,
									recipient: t.recipient,
									phone: t.phone ?? "",
									street: t.address,
									provinceCode: t.provinceCode ?? "",
									communeCode: t.communeCode ?? "",
									province: u?.regions.find((e) => e.code === t.provinceCode)?.name ?? "",
									commune: u?.regions.find((e) => e.code === t.provinceCode)?.communes.find((e) => e.code === t.communeCode)?.name ?? ""
								} : bf), E(!1), w(null);
							},
							children: [/* @__PURE__ */ (0, X.jsx)("option", {
								value: "",
								children: "Nhập địa chỉ mới"
							}), m.map((e) => /* @__PURE__ */ (0, X.jsxs)("option", {
								value: e.id,
								children: [
									e.recipient,
									" · ",
									e.address
								]
							}, e.id))]
						})] }),
						/* @__PURE__ */ (0, X.jsx)("p", {
							className: "purchaseHint",
							children: "Địa chỉ này dùng cho tất cả món bạn đã chọn."
						}),
						/* @__PURE__ */ (0, X.jsxs)("fieldset", {
							disabled: D || !!ve.current,
							children: [/* @__PURE__ */ (0, X.jsxs)("div", {
								className: "purchaseFields",
								children: [
									/* @__PURE__ */ (0, X.jsxs)("label", { children: [
										/* @__PURE__ */ (0, X.jsxs)("span", {
											className: "purchaseFieldLabel",
											id: "purchase-recipient-label",
											children: [
												"Người nhận",
												" ",
												/* @__PURE__ */ (0, X.jsx)("span", {
													className: "requiredMark",
													"aria-hidden": "true",
													children: "*"
												})
											]
										}),
										/* @__PURE__ */ (0, X.jsx)("input", {
											...Se("recipient"),
											autoComplete: "shipping name",
											value: f.recipient,
											onChange: (e) => k({ recipient: e.target.value }),
											maxLength: 120,
											required: !0
										}),
										O("recipient")
									] }),
									/* @__PURE__ */ (0, X.jsxs)("label", { children: [
										/* @__PURE__ */ (0, X.jsxs)("span", {
											className: "purchaseFieldLabel",
											id: "purchase-phone-label",
											children: [
												"Số điện thoại",
												" ",
												/* @__PURE__ */ (0, X.jsx)("span", {
													className: "requiredMark",
													"aria-hidden": "true",
													children: "*"
												})
											]
										}),
										/* @__PURE__ */ (0, X.jsx)("input", {
											...Se("phone"),
											autoComplete: "shipping tel",
											type: "tel",
											value: f.phone,
											onChange: (e) => k({ phone: e.target.value.replace(/\s/g, "") }),
											maxLength: 20,
											required: !0
										}),
										O("phone")
									] }),
									/* @__PURE__ */ (0, X.jsxs)("label", { children: [
										/* @__PURE__ */ (0, X.jsx)("span", {
											className: "purchaseFieldLabel",
											children: "Quốc gia"
										}),
										/* @__PURE__ */ (0, X.jsx)("input", {
											value: "Việt Nam",
											readOnly: !0
										}),
										/* @__PURE__ */ (0, X.jsx)("span", {
											className: "purchaseFieldError",
											"aria-hidden": "true"
										})
									] }),
									/* @__PURE__ */ (0, X.jsxs)("div", {
										className: "purchaseRegionField",
										children: [
											/* @__PURE__ */ (0, X.jsxs)("label", {
												htmlFor: "purchase-provinceCode",
												className: "purchaseFieldLabel",
												id: "purchase-provinceCode-label",
												children: [
													"Tỉnh / thành phố",
													" ",
													/* @__PURE__ */ (0, X.jsx)("span", {
														className: "requiredMark",
														"aria-hidden": "true",
														children: "*"
													})
												]
											}),
											/* @__PURE__ */ (0, X.jsx)(Z, {
												...Se("provinceCode"),
												options: u?.regions ?? [],
												disabled: !u?.regions.length || D || !!ve.current,
												placeholder: u?.regions.length ? "Tìm tỉnh / thành phố" : "Chưa có danh mục tỉnh / thành phố",
												value: f.provinceCode,
												onSelect: (e) => k(ff(u?.regions ?? [], e?.code ?? ""))
											}, y),
											O("provinceCode")
										]
									}),
									/* @__PURE__ */ (0, X.jsxs)("div", {
										className: "purchaseRegionField",
										children: [
											/* @__PURE__ */ (0, X.jsxs)("label", {
												htmlFor: "purchase-communeCode",
												className: "purchaseFieldLabel",
												id: "purchase-communeCode-label",
												children: [
													"Phường / xã",
													" ",
													/* @__PURE__ */ (0, X.jsx)("span", {
														className: "requiredMark",
														"aria-hidden": "true",
														children: "*"
													})
												]
											}),
											/* @__PURE__ */ (0, X.jsx)(Z, {
												...Se("communeCode"),
												options: Ee?.communes ?? [],
												disabled: !Ee?.communes.length || D || !!ve.current,
												placeholder: Ee ? "Tìm phường / xã" : "Chọn tỉnh / thành phố trước",
												value: f.communeCode,
												onSelect: (e) => k({
													communeCode: e?.code ?? "",
													commune: e?.name ?? ""
												})
											}, `${y}:${f.provinceCode}`),
											O("communeCode")
										]
									}),
									/* @__PURE__ */ (0, X.jsxs)("label", {
										className: "purchaseWide",
										children: [
											/* @__PURE__ */ (0, X.jsxs)("span", {
												className: "purchaseFieldLabel",
												id: "purchase-street-label",
												children: [
													"Số nhà, đường, tòa nhà / căn hộ",
													" ",
													/* @__PURE__ */ (0, X.jsx)("span", {
														className: "requiredMark",
														"aria-hidden": "true",
														children: "*"
													})
												]
											}),
											/* @__PURE__ */ (0, X.jsx)("input", {
												...Se("street"),
												required: !0,
												autoComplete: "shipping street-address",
												value: f.street,
												onChange: (e) => k({ street: e.target.value }),
												maxLength: 300
											}),
											O("street")
										]
									}),
									/* @__PURE__ */ (0, X.jsxs)("label", {
										className: "purchaseWide",
										children: [
											/* @__PURE__ */ (0, X.jsxs)("span", {
												className: "purchaseFieldLabel",
												id: "purchase-note-label",
												children: ["Ghi chú giao hàng ", /* @__PURE__ */ (0, X.jsx)("small", { children: "Không bắt buộc" })]
											}),
											/* @__PURE__ */ (0, X.jsx)("textarea", {
												...Se("note"),
												value: f.note,
												onChange: (e) => k({ note: e.target.value }),
												maxLength: 500
											}),
											O("note")
										]
									})
								]
							}), /* @__PURE__ */ (0, X.jsx)(Cd, { controller: ce })]
						}),
						!u?.regions.length && /* @__PURE__ */ (0, X.jsxs)("p", {
							role: "status",
							children: [
								"Danh mục khu vực chưa tải được.",
								" ",
								/* @__PURE__ */ (0, X.jsx)("button", {
									type: "button",
									onClick: () => window.location.reload(),
									children: "Tải lại"
								})
							]
						})
					]
				}) : /* @__PURE__ */ (0, X.jsxs)("section", {
					className: "purchaseCard purchaseReview",
					children: [
						/* @__PURE__ */ (0, X.jsxs)("div", {
							className: "purchaseSectionHeading",
							children: [/* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("h2", { children: l ? "Món liên quan" : "Món đã chọn" }), /* @__PURE__ */ (0, X.jsxs)("small", { children: [
								C?.lines.length ?? 0,
								" dòng ·",
								" ",
								C?.lines.reduce((e, t) => e + t.quantity, 0) ?? 0,
								" ",
								"món"
							] })] }), /* @__PURE__ */ (0, X.jsx)(yn, {
								to: l ? `/account/orders/${c}` : "/cart",
								children: l ? "Xem đơn hàng" : "Sửa giỏ hàng"
							})]
						}),
						C?.lines.map((e) => /* @__PURE__ */ (0, X.jsxs)("div", {
							className: "purchaseItem",
							children: [
								/* @__PURE__ */ (0, X.jsx)(tf, {
									draftId: e.draftId,
									itemIndex: e.itemIndex,
									mediaId: e.mediaId
								}),
								/* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, X.jsxs)("small", { children: [
									e.quantity,
									" sản phẩm ·",
									" ",
									e.kind === "custom" ? "Cần tìm mua" : "Giá niêm yết"
								] })] }),
								/* @__PURE__ */ (0, X.jsx)("strong", { children: yf(e.total) })
							]
						}, e.lineId)),
						/* @__PURE__ */ (0, X.jsxs)("div", {
							className: "purchaseDelivery",
							children: [/* @__PURE__ */ (0, X.jsxs)("div", {
								className: "purchaseSectionHeading",
								children: [/* @__PURE__ */ (0, X.jsx)("h3", { children: "Giao đến" }), !l && /* @__PURE__ */ (0, X.jsx)("button", {
									type: "button",
									disabled: D || !!ve.current,
									onClick: () => {
										S(1), E(!1), requestAnimationFrame(() => he.current?.focus());
									},
									children: "Sửa địa chỉ"
								})]
							}), /* @__PURE__ */ (0, X.jsxs)("p", { children: [
								f.recipient,
								" · ",
								f.phone,
								/* @__PURE__ */ (0, X.jsx)("br", {}),
								f.street,
								", ",
								f.commune,
								", ",
								f.province,
								", Việt Nam"
							] })]
						}),
						/* @__PURE__ */ (0, X.jsx)(cf, {
							value: ae,
							enabledMethods: se,
							disabled: D || !!ve.current,
							onChange: (e) => {
								oe(e), E(!1);
							}
						}),
						!l && /* @__PURE__ */ (0, X.jsx)("p", {
							className: "purchaseTerms",
							children: "Giá niêm yết giữ trọn gói. Món cần tìm mua có thể phát sinh giá và cước; bạn duyệt khoản trả thêm trước khi gửi."
						})
					]
				}), /* @__PURE__ */ (0, X.jsxs)("aside", {
					className: "purchaseCard purchaseSummary",
					children: [
						/* @__PURE__ */ (0, X.jsx)("h2", { children: "Chi tiết thanh toán" }),
						C ? /* @__PURE__ */ (0, X.jsxs)(X.Fragment, { children: [
							/* @__PURE__ */ (0, X.jsxs)("div", {
								className: "purchaseRow",
								children: [/* @__PURE__ */ (0, X.jsx)("span", { children: l ? "Đã thanh toán trước đó" : "Sản phẩm niêm yết" }), /* @__PURE__ */ (0, X.jsx)("strong", { children: yf(l ? C.previouslyPaid ?? 0 : C.listed) })]
							}),
							/* @__PURE__ */ (0, X.jsxs)("div", {
								className: "purchaseRow",
								children: [/* @__PURE__ */ (0, X.jsx)("span", { children: l ? "Khoản cần trả thêm" : "Giá hàng cần tìm mua" }), /* @__PURE__ */ (0, X.jsx)("strong", { children: yf(C.goods) })]
							}),
							!l && /* @__PURE__ */ (0, X.jsxs)("div", {
								className: "purchaseRow",
								children: [/* @__PURE__ */ (0, X.jsx)("span", { children: "Phí mua hộ" }), /* @__PURE__ */ (0, X.jsx)("strong", { children: yf(C.service) })]
							}),
							/* @__PURE__ */ (0, X.jsxs)("div", {
								className: "purchaseTotal",
								children: [/* @__PURE__ */ (0, X.jsx)("span", { children: l ? "Thanh toán thêm" : "Thanh toán ban đầu" }), /* @__PURE__ */ (0, X.jsx)("p", { children: yf(C.total) })]
							})
						] }) : /* @__PURE__ */ (0, X.jsx)("p", {
							className: "purchaseHint",
							children: "Số tiền được kiểm tra lại khi bạn xem tổng quan."
						}),
						/* @__PURE__ */ (0, X.jsx)("p", {
							className: "purchaseHint",
							children: l ? C?.balanceReason === "sourcing" ? "Khoản chênh lệch giá mua đã được bạn duyệt. Nhân viên chỉ mua vượt giá ban đầu khi đã đủ tiền; cước được chốt trước khi gửi." : "Khoản này dựa trên chi phí cuối bạn đã duyệt. Nhân viên chỉ gửi hàng khi đủ tiền." : "100% giá hàng và phí mua hộ. Giá niêm yết đã gồm cước; món cần tìm mua chốt cước trước khi gửi."
						}),
						!l && n.items.some((e) => e.kind === "custom") && /* @__PURE__ */ (0, X.jsxs)("section", {
							className: "purchaseShipping",
							"aria-labelledby": "purchaseShippingHeading",
							children: [
								/* @__PURE__ */ (0, X.jsxs)("div", {
									className: "purchaseSectionHeading",
									children: [/* @__PURE__ */ (0, X.jsx)("h3", {
										id: "purchaseShippingHeading",
										children: "Cước vận chuyển"
									}), /* @__PURE__ */ (0, X.jsx)(yn, {
										to: "/fees",
										children: "Biểu phí ↗"
									})]
								}),
								/* @__PURE__ */ (0, X.jsxs)("div", {
									className: "purchaseFreight",
									children: [/* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsxs)("span", { children: [
										"Quốc tế dự tính",
										C?.shipping.state === "reference" ? " · tham khảo" : "",
										" ",
										"· chưa thu"
									] }), /* @__PURE__ */ (0, X.jsx)("strong", { children: C?.shipping.amountUsdMinor === void 0 ? C?.shipping.state === "quote_required" ? "Cần báo giá" : C?.shipping.state === "unavailable" ? "Chưa có cước" : "Chưa tính" : new Intl.NumberFormat("vi-VN", {
										style: "currency",
										currency: "USD"
									}).format(C.shipping.amountUsdMinor / 100) })] }), /* @__PURE__ */ (0, X.jsx)("p", { children: C?.shipping.amountUsdMinor === void 0 ? "Chưa biết cân nặng? Có thể chốt cước sau, trước khi gửi." : "Cước dự tính theo loại hàng và cân nặng đã nhập. Chưa gồm thông quan và giao nội địa." })]
								}),
								/* @__PURE__ */ (0, X.jsxs)("div", {
									className: "purchaseRegion",
									children: [/* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("span", { children: "Giao nội địa" }), /* @__PURE__ */ (0, X.jsx)("strong", { children: f.commune && f.province ? `${f.commune}, ${f.province}` : "Chọn địa chỉ ở bước Nhận hàng" })] }), /* @__PURE__ */ (0, X.jsx)("small", { children: "Phí cần xác nhận" })]
								}),
								/* @__PURE__ */ (0, X.jsxs)("details", { children: [
									/* @__PURE__ */ (0, X.jsx)("summary", { children: "Xem / điều chỉnh cước" }),
									/* @__PURE__ */ (0, X.jsxs)("fieldset", {
										disabled: D || !!ve.current,
										children: [
											/* @__PURE__ */ (0, X.jsxs)("label", { children: ["Kho xuất gửi", /* @__PURE__ */ (0, X.jsxs)("select", {
												value: le,
												onChange: (e) => {
													ue(e.target.value), fe(""), E(!1), w(null), S(1);
												},
												children: [/* @__PURE__ */ (0, X.jsx)("option", {
													value: "texas_cali",
													children: "Texas / California"
												}), /* @__PURE__ */ (0, X.jsx)("option", {
													value: "oregon",
													children: "Oregon"
												})]
											})] }),
											/* @__PURE__ */ (0, X.jsxs)("label", { children: ["Loại hàng để ước tính", /* @__PURE__ */ (0, X.jsxs)("select", {
												value: de,
												onChange: (e) => {
													fe(e.target.value), E(!1), w(null), S(1);
												},
												children: [/* @__PURE__ */ (0, X.jsx)("option", {
													value: "",
													children: "Chọn loại hàng"
												}), A.map((e) => /* @__PURE__ */ (0, X.jsx)("option", {
													value: e.id,
													children: e.label
												}, e.id))]
											})] }),
											/* @__PURE__ */ (0, X.jsxs)("label", { children: ["Tổng cân nặng dự kiến (kg)", /* @__PURE__ */ (0, X.jsx)("input", {
												inputMode: "decimal",
												value: pe,
												onChange: (e) => {
													me(e.target.value), E(!1), w(null), S(1);
												},
												placeholder: "Ví dụ: 1,5",
												maxLength: 12
											})] })
										]
									}),
									/* @__PURE__ */ (0, X.jsxs)("p", {
										className: "purchaseHint",
										children: ["Cước tối thiểu 1 kg; hàng cồng kềnh dùng cân quy đổi khi cao hơn cân thực. Nhân viên xác nhận loại hàng, cân nặng, thuế, bảo hiểm và cước giao nội địa trước khi bạn duyệt khoản trả thêm.", u?.shippingOrigin === "reference" ? " Biểu phí đang hiển thị là dữ liệu tham khảo, chưa phải giá đã công bố." : ""]
									})
								] })
							]
						}),
						x === 1 && /* @__PURE__ */ (0, X.jsxs)("div", {
							className: "purchaseOverviewAction",
							children: [/* @__PURE__ */ (0, X.jsx)("p", {
								className: "purchaseValidationSummary",
								role: "status",
								children: Object.keys(xe).length > 0 ? "Kiểm tra các ô được đánh dấu để tiếp tục." : ""
							}), /* @__PURE__ */ (0, X.jsx)("button", {
								type: "submit",
								form: "purchaseRecipientForm",
								className: "primary",
								disabled: D || i || !!ve.current || !u?.regions.length,
								children: D ? "Đang kiểm tra…" : "Xem tổng quan →"
							})]
						}),
						x === 2 && C && /* @__PURE__ */ (0, X.jsxs)("div", {
							className: "purchaseConfirm",
							children: [/* @__PURE__ */ (0, X.jsxs)("label", { children: [/* @__PURE__ */ (0, X.jsx)("input", {
								type: "checkbox",
								checked: T,
								disabled: D || !!ve.current,
								onChange: (e) => E(e.target.checked)
							}), /* @__PURE__ */ (0, X.jsxs)("span", { children: [
								"Tôi đã kiểm tra món, địa chỉ và số tiền cần thanh toán",
								" ",
								l ? "thêm" : "ban đầu",
								"."
							] })] }), /* @__PURE__ */ (0, X.jsxs)("div", {
								className: "purchaseActions",
								children: [/* @__PURE__ */ (0, X.jsx)("button", {
									type: "button",
									disabled: D || !!ve.current,
									onClick: () => {
										l ? o(`/account/orders/${c}`) : (S(1), E(!1));
									},
									children: "Quay lại"
								}), /* @__PURE__ */ (0, X.jsx)("button", {
									className: "primary",
									disabled: D || !T || !!ve.current || !ae || !se.includes(ae),
									onClick: () => void Te(),
									children: D ? "Đang xử lý…" : "Xác nhận & thanh toán"
								})]
							})]
						})
					]
				})]
			})
		]
	}) : /* @__PURE__ */ (0, X.jsxs)("section", {
		className: "page purchaseCheckout",
		children: [
			/* @__PURE__ */ (0, X.jsx)("h1", { children: "Hoàn tất đơn mua hộ" }),
			/* @__PURE__ */ (0, X.jsx)("p", { children: "Đăng nhập để dùng giỏ và địa chỉ của bạn." }),
			/* @__PURE__ */ (0, X.jsx)(rf, { signIn: t })
		]
	});
}
//#endregion
//#region src/features/profile/profile-state.ts
var Cf = {
	displayName: "",
	businessName: "",
	marketingConsent: !1
};
function wf(e = "") {
	return {
		uid: e,
		locked: !1,
		profile: { ...Cf },
		addresses: [],
		profileReady: !1,
		addressesReady: !1,
		profileError: "",
		addressesError: ""
	};
}
function Tf(e, t) {
	if (t.type === "reset") return wf(t.uid);
	if (t.uid !== e.uid) return e;
	if (t.type === "locked") return {
		...wf(e.uid),
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
			profile: { ...Cf },
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
//#endregion
//#region packages/domain/customer-save.ts
var Ef = U({
	schemaVersion: W(1),
	action: Ou(["saveProfile", "saveAddress"]),
	operationId: B().uuid(),
	commandHash: B().regex(/^[a-f0-9]{64}$/),
	expectedVersion: H().int().nonnegative().safe()
}).strict(), Df = U({
	id: B().min(1).max(128),
	version: H().int().positive().safe()
}).strict(), Of = wu("status", [U({
	status: W("saved"),
	result: Df
}).strict(), U({ status: W("not-saved") }).strict()]);
//#endregion
//#region src/features/profile/save-recovery.ts
async function kf(e) {
	let t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(e));
	return Array.from(new Uint8Array(t), (e) => e.toString(16).padStart(2, "0")).join("");
}
async function Af(e) {
	return `satsunicgo.customer-save.v1.${await kf(e)}`;
}
async function jf(e) {
	let t = localStorage.getItem(await Af(e));
	return t === null ? null : Ef.parse(JSON.parse(t));
}
async function Mf(e, t) {
	let n = await Af(e), r = await kf(JSON.stringify(t)), i = Ef.parse({
		schemaVersion: 1,
		action: t.action,
		operationId: t.operationId,
		commandHash: r,
		expectedVersion: t.expectedVersion ?? 0
	});
	if (!navigator.locks) throw Error("RECOVERY_STORAGE_UNAVAILABLE");
	return navigator.locks.request(n, () => {
		let e = localStorage.getItem(n);
		return e === null ? (localStorage.setItem(n, JSON.stringify(i)), {
			pointer: i,
			reserved: !0
		}) : {
			pointer: Ef.parse(JSON.parse(e)),
			reserved: !1
		};
	});
}
async function Nf(e, t) {
	let n = await Af(e);
	if (!navigator.locks) throw Error("RECOVERY_STORAGE_UNAVAILABLE");
	await navigator.locks.request(n, () => {
		let e = localStorage.getItem(n);
		if (e === null) return;
		let r = Ef.parse(JSON.parse(e));
		if (r.operationId !== t.operationId || r.commandHash !== t.commandHash) throw Error("RECOVERY_POINTER_CHANGED");
		localStorage.removeItem(n);
	});
}
//#endregion
//#region src/features/profile/Profile.tsx
function Pf({ user: e, blocked: t = !1, onPendingChange: n }) {
	let r = (0, _.useId)(), [i, a] = (0, _.useReducer)(Tf, void 0, () => wf(e?.uid)), o = i.uid === (e?.uid ?? "") ? i : wf(e?.uid), { profile: s, version: c, addresses: l } = o, u = (0, _.useRef)(e?.uid);
	u.current = e?.uid;
	let d = (t) => a({
		type: "edit",
		uid: e?.uid ?? "",
		profile: t
	}), [f, p] = (0, _.useState)(""), [m, h] = (0, _.useState)(!1), [g, v] = (0, _.useState)(0), [y, b] = (0, _.useState)(1), [x, S] = (0, _.useState)(""), [C, w] = (0, _.useState)(!1), T = (0, _.useRef)(null), E = (0, _.useRef)(null), [D, ee] = (0, _.useState)(!1), [te, ne] = (0, _.useState)(0);
	(0, _.useEffect)(() => {
		T.current = null, E.current = null, ie.current = !1, w(!1), ee(!1);
		let t = !0;
		return e ? jf(e.uid).then((n) => {
			t && u.current === e.uid && (E.current = n, w(!!n), ee(!0), n && p("Có lần lưu đang chờ kết quả. Kiểm tra lần lưu trước khi tiếp tục."));
		}).catch(() => {
			t && p("Chưa kiểm tra được lần lưu trước. Anh/chị thử kiểm tra lại nhé.");
		}) : ee(!0), () => {
			t = !1, T.current = null, E.current = null;
		};
	}, [e?.uid, te]), (0, _.useEffect)(() => {
		n?.(m || C);
	}, [
		m,
		C,
		n
	]);
	let re = (0, _.useRef)(0), ie = (0, _.useRef)(!1);
	(0, _.useEffect)(() => {
		if (re.current++, a({
			type: "reset",
			uid: e?.uid ?? ""
		}), S(""), p(""), h(!1), !e) return;
		if (!ad) {
			a({
				type: "profile-error",
				uid: e.uid
			}), a({
				type: "addresses-error",
				uid: e.uid
			});
			return;
		}
		let t = !0, n = !1, r = e.uid, i = Md(Ed(ad, "users", r), (i) => {
			if (!t || n) return;
			let o = i.data();
			if (o?.locked === !0) {
				n = !0, re.current++, T.current = null, ie.current = !1, w(!1), a({
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
		}), o = Md(Ad(Dd(ad, "addresses"), Od("ownerId", "==", r), kd(20)), (e) => {
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
			t = !1, re.current++, i(), o();
		};
	}, [e?.uid, g]);
	async function ae(n, r) {
		if (n?.preventDefault(), !e || od?.currentUser?.uid !== e.uid || i.locked || ie.current || t || i.uid !== e.uid || !i.profileReady || !D || (T.current?.command.action ?? r) === "saveAddress" && !i.addressesReady || E.current && n || T.current && (n || T.current.owner !== e.uid)) return;
		if (!T.current) {
			if (!n || !r) return;
			let t = new FormData(n.currentTarget);
			T.current = {
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
		let a = T.current.command;
		ie.current = !0;
		let o = re.current, s = e.uid, l = () => o === re.current && u.current === s && od?.currentUser?.uid === s;
		p(""), S(""), h(!0), w(!0);
		try {
			if (!E.current) {
				let e = await Mf(s, a);
				if (!l()) return;
				if (E.current = e.pointer, !e.reserved) {
					T.current = null, p("Có lần lưu đang chờ kết quả. Kiểm tra lần lưu trước khi tiếp tục.");
					return;
				}
			}
			let e = Df.parse(await hd("workspaceCommand", a));
			if (a.action === "saveProfile" && e.id !== s || e.version !== (a.expectedVersion ?? 0) + 1) throw Error("INVALID_SAVE_RESULT");
			if (l()) {
				if (await Nf(s, E.current), !l()) return;
				E.current = null, T.current = null, w(!1), Bd(a.action === "saveProfile" ? "Đã lưu hồ sơ." : "Đã lưu địa chỉ.", "success");
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
				].includes(t) ? (T.current = null, p("Chưa lưu được thông tin. Kiểm tra lần lưu trước khi thử lại.")) : E.current ? p("Chưa xác minh được kết quả lưu. Đối chiếu thao tác đang chờ trước khi tiếp tục.") : (T.current = null, w(!1), ee(!1), p("Chưa chuẩn bị được lần lưu. Anh/chị thử kiểm tra lại nhé."));
			}
		} finally {
			l() && (ie.current = !1, h(!1));
		}
	}
	async function oe() {
		if (T.current) return ae();
		if (!e || od?.currentUser?.uid !== e.uid || !E.current || ie.current || t || o.locked) return;
		let n = E.current, r = e.uid, i = re.current, a = () => i === re.current && u.current === r && od?.currentUser?.uid === r;
		ie.current = !0, h(!0), p("");
		try {
			let e = Of.parse(await hd("customerSaveResolve", n));
			if (!a()) return;
			if (e.status === "saved" && (e.result.version !== n.expectedVersion + 1 || n.action === "saveProfile" && e.result.id !== r)) throw Error("INVALID_RECOVERY_RESULT");
			if (await Nf(r, n), !a()) return;
			E.current = null, w(!1), S(e.status === "saved" ? "Đã xác minh lần lưu trước thành công. Kiểm tra thông tin đã lưu trước khi cập nhật tiếp." : "Lần lưu trước chưa hoàn tất. Anh/chị có thể gửi lại thông tin.");
		} catch {
			a() && p("Chưa đối chiếu được kết quả. Giữ nguyên lần lưu đang chờ và thử lại.");
		} finally {
			a() && (ie.current = !1, h(!1));
		}
	}
	function se(e, t) {
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
		}) : r ? null : /* @__PURE__ */ (0, X.jsx)(Hd, {
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
				}), /* @__PURE__ */ (0, X.jsx)("p", { children: "Thông tin cá nhân và địa chỉ nhận hàng của bạn." })] }), e && /* @__PURE__ */ (0, X.jsxs)(yn, {
					className: "profileOrderLink",
					to: "/account",
					children: ["Đơn hàng của tôi ", /* @__PURE__ */ (0, X.jsx)("span", {
						"aria-hidden": "true",
						children: "→"
					})]
				})]
			}),
			/* @__PURE__ */ (0, X.jsx)(Td, {}),
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
						children: y === 3 && /* @__PURE__ */ (0, X.jsx)(wd, {
							user: e,
							blocked: t || m || C || o.locked,
							onPendingChange: n
						}, e.uid)
					}),
					/* @__PURE__ */ (0, X.jsxs)("form", {
						id: `${r}-profilePersonalPanel`,
						hidden: y !== 1,
						className: "form profileCard",
						onSubmit: (e) => void ae(e, "saveProfile"),
						"aria-labelledby": `${r}-personalTitle`,
						children: [
							/* @__PURE__ */ (0, X.jsx)("header", {
								className: "profileCardHeading",
								children: /* @__PURE__ */ (0, X.jsxs)("div", { children: [/* @__PURE__ */ (0, X.jsx)("h2", {
									id: `${r}-personalTitle`,
									children: "Thông tin cá nhân"
								}), /* @__PURE__ */ (0, X.jsx)("p", { children: "Cập nhật thông tin cá nhân của bạn." })] })
							}),
							se("profile", y === 1),
							/* @__PURE__ */ (0, X.jsxs)("fieldset", {
								disabled: m || t || C || !D || !o.profileReady || o.locked,
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
							!o.profileReady && se("profile", y === 2),
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
									}) : se("addresses", y === 2),
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
								onSubmit: (e) => void ae(e, "saveAddress"),
								"aria-labelledby": `${r}-newAddressTitle`,
								children: [/* @__PURE__ */ (0, X.jsx)("header", {
									className: "profileCardHeading",
									children: /* @__PURE__ */ (0, X.jsx)("div", { children: /* @__PURE__ */ (0, X.jsx)("h2", {
										id: `${r}-newAddressTitle`,
										children: "Thêm địa chỉ nhận hàng"
									}) })
								}), /* @__PURE__ */ (0, X.jsxs)("fieldset", {
									disabled: m || t || C || !D || !o.profileReady || !o.addressesReady || o.locked,
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
					m && /* @__PURE__ */ (0, X.jsx)(Hd, {
						overlay: !1,
						children: "Đang lưu thông tin…"
					}),
					x && /* @__PURE__ */ (0, X.jsx)("p", {
						role: "status",
						className: "profileHint",
						children: x
					}),
					f && /* @__PURE__ */ (0, X.jsx)("p", {
						role: "alert",
						className: "profileNotice",
						children: f
					})
				]
			}),
			e && C && !o.locked && /* @__PURE__ */ (0, X.jsx)("button", {
				type: "button",
				disabled: m || t || !D,
				onClick: () => void oe(),
				children: "Đối chiếu thao tác đang chờ"
			}),
			e && !D && /* @__PURE__ */ (0, X.jsx)("button", {
				type: "button",
				disabled: m,
				onClick: () => ne((e) => e + 1),
				children: "Thử kiểm tra lại"
			}),
			/* @__PURE__ */ (0, X.jsxs)("footer", {
				className: "profilePrivacy",
				children: [
					/* @__PURE__ */ (0, X.jsx)("span", { children: "Dữ liệu cá nhân" }),
					/* @__PURE__ */ (0, X.jsx)(yn, {
						to: "/support?topic=data-export",
						children: "Yêu cầu xuất dữ liệu"
					}),
					/* @__PURE__ */ (0, X.jsx)(yn, {
						to: "/support?topic=data-deletion",
						children: "Yêu cầu xóa dữ liệu"
					})
				]
			})
		]
	});
}
//#endregion
//#region \0emailFixtureRoutes
var Ff = () => {};
//#endregion
//#region src/features/account/AccountRail.tsx
function If({ kind: e }) {
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
function Lf({ active: e }) {
	return /* @__PURE__ */ (0, X.jsxs)("aside", {
		className: "customerRail",
		onPointerOver: Ff,
		onFocusCapture: Ff,
		children: [
			/* @__PURE__ */ (0, X.jsx)("span", {
				className: "customerRailLabel",
				children: "TÀI KHOẢN"
			}),
			/* @__PURE__ */ (0, X.jsxs)("nav", {
				"aria-label": "Không gian khách hàng",
				children: [
					/* @__PURE__ */ (0, X.jsxs)(yn, {
						to: "/account",
						"aria-current": e === "orders" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(If, { kind: "orders" }), "Đơn của tôi"]
					}),
					/* @__PURE__ */ (0, X.jsxs)(yn, {
						to: "/account?view=shipments",
						"aria-current": e === "shipments" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(If, { kind: "shipments" }), "Vận chuyển"]
					}),
					/* @__PURE__ */ (0, X.jsxs)(yn, {
						to: "/account?view=notifications",
						"aria-current": e === "notifications" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(If, { kind: "notifications" }), "Thông báo"]
					}),
					/* @__PURE__ */ (0, X.jsx)("div", { className: "customerRailDivider" }),
					/* @__PURE__ */ (0, X.jsxs)(yn, {
						className: "customerSecondary",
						to: "/account/documents",
						children: [/* @__PURE__ */ (0, X.jsx)(If, { kind: "documents" }), "Chứng từ của tôi"]
					}),
					/* @__PURE__ */ (0, X.jsxs)(yn, {
						className: "customerSecondary",
						to: "/account/profile",
						"aria-current": e === "profile" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(If, { kind: "profile" }), "Hồ sơ và địa chỉ"]
					}),
					/* @__PURE__ */ (0, X.jsxs)(yn, {
						className: "customerSecondary",
						to: "/account/security",
						"aria-current": e === "security" ? "page" : void 0,
						children: [/* @__PURE__ */ (0, X.jsx)(If, { kind: "security" }), "Bảo mật tài khoản"]
					})
				]
			}),
			/* @__PURE__ */ (0, X.jsxs)(yn, {
				className: "customerHelp",
				to: "/support",
				children: [/* @__PURE__ */ (0, X.jsxs)("span", {
					className: "customerHelpLabel",
					children: [/* @__PURE__ */ (0, X.jsx)(If, { kind: "support" }), "Cần hỗ trợ?"]
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
//#region ../../../../../../private/tmp/satsunicgo-email-content-source-render/interactive.tsx
var Rf = {
	uid: "email-content-preview-only",
	email: "customer@example.invalid",
	displayName: "Khách hàng minh họa"
}, zf = new URLSearchParams(location.search).get("screen") || "profile";
(0, $u.createRoot)(document.getElementById("emailContentRoot")).render(/* @__PURE__ */ (0, X.jsx)(Nt, { children: zf === "checkout" ? /* @__PURE__ */ (0, X.jsx)(Sf, {
	user: Rf,
	signIn: () => {}
}) : zf === "token" ? /* @__PURE__ */ (0, X.jsx)("div", {
	className: "accountPage",
	children: /* @__PURE__ */ (0, X.jsx)(Td, {})
}) : zf === "preferences" ? /* @__PURE__ */ (0, X.jsx)("div", {
	className: "accountPage",
	children: /* @__PURE__ */ (0, X.jsx)(wd, { user: Rf })
}) : /* @__PURE__ */ (0, X.jsxs)("section", {
	className: "accountWorkspace",
	children: [/* @__PURE__ */ (0, X.jsx)(Lf, { active: "profile" }), /* @__PURE__ */ (0, X.jsx)("div", {
		className: "accountPage",
		children: /* @__PURE__ */ (0, X.jsx)(Pf, { user: Rf })
	})]
}) }));
//#endregion
