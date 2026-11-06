"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const e=require("solid-js/web"),p=require("solid-js"),b=require("@opencode/plugin/gui"),N=require("@opencode/plugin/rpc"),_={type:"object",properties:{percent:{type:"number"},limited:{type:"boolean"},resetsAt:{type:"number"}},required:["percent","limited","resetsAt"],additionalProperties:!1},J=N.Rpc.define({id:"go-usage",methods:{get:{input:{type:"object",properties:{},additionalProperties:!1},output:{type:"object",properties:{available:{type:"boolean"},reason:{type:"string"},rolling:_,weekly:_,monthly:_,fetchedAt:{type:"number"}},required:["available"],additionalProperties:!1}}},events:{}});var V=e.template('<svg class=go-ticks viewBox="0 0 71 9"preserveAspectRatio=none shape-rendering=crispEdges aria-hidden=true>'),O=e.template("<svg><rect y=0 width=2 height=9></svg>",!1,!0,!1),X=e.template('<svg class=go-row-ticks viewBox="0 0 215 9"preserveAspectRatio=none aria-hidden=true>'),Q=e.template('<div class=go-detail><div class=go-detail-head><span class=go-detail-title><span class=go-mark>GO</span>OpenCode Go</span></div><div class=go-detail-sub>剩余额度</div><div class=go-pace><svg width=12 height=12 viewBox="0 0 16 16"aria-hidden=true><path d="M3.5 8.5 6.4 11.4 12.5 4.8"fill=none stroke=currentColor stroke-width=1.8 stroke-linecap=round stroke-linejoin=round></path></svg><span></span></div><div class=go-detail-foot><span>剩余比例，不是已用</span><span class=go-detail-link>在 Console 查看 →'),Y=e.template("<div class=go-detail-empty>"),Z=e.template("<div class=go-detail-row><span class=go-detail-label></span><span class=go-detail-percent>%</span><span class=go-detail-reset>"),ee=e.template("<span class=go-divider>"),R=e.template("<span class=go-chev>›"),te=e.template("<div class=go-usage-bar><button class=go-chip><span class=go-brand>Go"),ne=e.template("<span class=go-muted>"),re=e.template("<span class=go-meter><b>");const M=24,w=72,ie="https://opencode.ai/console",oe=6e4,ae=`
.go-usage-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 16px;
  user-select: none;
}
.go-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 3.5%, transparent);
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: background-color 140ms ease;
}
.go-chip:hover {
  background: color-mix(in srgb, currentColor 7%, transparent);
}
.go-chip:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 2px;
}
.go-brand {
  width: 18px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.035em;
  opacity: 0.72;
}
.go-muted {
  font-size: 10.5px;
  opacity: 0.55;
}
.go-divider {
  width: 1px;
  height: 14px;
  flex: none;
  background: color-mix(in srgb, currentColor 11%, transparent);
}
.go-meter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 9px;
  flex: none;
}
.go-meter > b {
  width: 15px;
  text-align: right;
  font-size: 9px;
  line-height: 1;
  font-weight: 500;
  opacity: 0.55;
}
.go-ticks {
  display: block;
  width: var(--ticks-w, 35px);
  height: 9px;
  flex: none;
}
.go-chev {
  width: 8px;
  text-align: center;
  font-size: 13px;
  line-height: 1;
  opacity: 0.45;
}
.go-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 300px;
}
.go-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.go-detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}
.go-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 7px;
  background: color-mix(in srgb, #2f9e6b 12%, transparent);
  color: #257d54;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.go-detail-sub {
  margin: -3px 0 8px;
  font-size: 10px;
  opacity: 0.5;
}
.go-detail-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 38px 86px;
  align-items: center;
  gap: 9px;
  height: 28px;
  font-size: 10.5px;
}
.go-detail-label { opacity: 0.65; }
.go-detail-percent {
  text-align: right;
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
.go-detail-reset {
  text-align: right;
  font-size: 9.5px;
  opacity: 0.45;
}
.go-row-ticks {
  display: block;
  width: 100%;
  height: 10px;
}
.go-pace {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  background: color-mix(in srgb, currentColor 4%, transparent);
  font-size: 10.5px;
  line-height: 1.5;
  opacity: 0.8;
}
.go-pace b { font-weight: 600; opacity: 1; }
.go-pace svg { flex: none; color: #3ba974; }
.go-detail-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  font-size: 10px;
  opacity: 0.55;
}
.go-detail-link { color: #257d54; opacity: 1; }
.go-detail-empty {
  padding: 6px 0 10px;
  font-size: 12px;
  opacity: 0.6;
}
`;function y(o,m=M){const u=Math.max(0,Math.min(100,o));return Math.round(u/100*m)}function j(o){const m=o-Date.now();if(!Number.isFinite(m)||m<=0)return"即将重置";const u=Math.ceil(m/6e4);if(u<60)return`${u} 分钟后重置`;const l=Math.floor(u/60);return l<24?`${l} 小时后重置`:`${Math.floor(l/24)} 天后重置`}function G(o){switch(o){case"not-connected":return"未连接 OpenCode Go";case"no-key":return"未找到 Go API Key";case"request-failed":return"读取失败";case"invalid-response":return"返回格式异常";case"aborted":return"已取消";default:return o?.startsWith("http-")?`服务返回 ${o.slice(5)}`:"额度暂不可用"}}function se(o,m){if(!m)return{text:"读取中…",tone:"idle"};if(!o.length)return{text:"暂无数据",tone:"idle"};const u=Math.min(...o.map(l=>l.remaining));return o.some(l=>l.limited)?{text:"额度用尽",tone:"danger"}:u>=60?{text:"额度充裕",tone:"ok"}:u>=30?{text:"用量平稳",tone:"ok"}:u>=10?{text:"注意用量",tone:"warn"}:{text:"接近上限",tone:"danger"}}function le(o){if(o.some(l=>l.limited))return{short:"已限流",detail:"当前窗口已限流，等待重置或切换模型。"};if(o.some(l=>l.remaining<10))return{short:"接近上限",detail:"余量接近上限，建议切换免费模型或等待重置。"};const m=o.map(l=>l.pace).filter(l=>typeof l=="number");if(!m.length)return{short:"余量充足",detail:"节奏数据积累中，先按余量显示。"};const u=Math.max(...m);return u>10?{short:"节奏偏快",detail:"节奏偏快。按当前速度可能会在重置前用完。"}:u<-10?{short:"可用到重置",detail:"节奏从容。按当前速度可以用到重置，不必收着用。"}:{short:"节奏正常",detail:"节奏正常。按当前速度刚好用到重置。"}}const ce=b.Plugin.define({setup(o){const[m,u]=p.createSignal(),[l,T]=p.createSignal(!0),C=o.ui,$=p.createMemo(()=>{const t=m();return t?.available?t:void 0}),A=()=>{const t=m();return t&&!t.available?t.reason:void 0},x=p.createMemo(()=>{const t=$();if(!t)return[];const i=Date.now(),n=(a,r,s,c,d)=>{const g=Math.max(0,Math.min(100,100-c.percent)),f=Math.max(0,Math.min(1,1-(c.resetsAt-i)/d)),h=f<.03?void 0:100-g-f*100;return{key:a,label:r,short:s,remaining:g,limited:c.limited,resetsAt:c.resetsAt,pace:h}};return[n("rolling","5 小时","5h",t.rolling,300*60*1e3),n("weekly","本周","周",t.weekly,10080*60*1e3),n("monthly","本月","月",t.monthly,720*60*60*1e3)]}),v=p.createMemo(()=>se(x(),!!$())),q=p.createMemo(()=>le(x())),S=t=>t.limited?"已限流":`剩余 ${Math.round(t.remaining)}% · ${j(t.resetsAt)}`,k=async()=>{try{u(await o.client.rpc(J).get({}))}catch{}finally{T(!1)}};k();const B=setInterval(()=>{k()},oe);p.onCleanup(()=>clearInterval(B)),b.createKeyed(()=>o.servers.get("sidecar")?.data,t=>p.onCleanup(t.on("session.execution.succeeded",()=>{k()})));const D=Array.from({length:M},(t,i)=>i),E=M*3-1,I=Array.from({length:w},(t,i)=>i),P=t=>{let i;const n=()=>{const r=i;if(!r)return;const s=window.devicePixelRatio||1,c=E/s;r.style.setProperty("--ticks-w",`${c}px`),r.style.transform="none";const d=r.getBoundingClientRect(),g=Math.round(d.left*s)/s-d.left;Math.abs(g)>.001&&(r.style.transform=`translateX(${g}px)`)};p.onMount(()=>{n();const r=new ResizeObserver(n);i&&r.observe(i),window.addEventListener("resize",n),p.onCleanup(()=>{r.disconnect(),window.removeEventListener("resize",n)})});const a=()=>t.tone==="danger"?"#cf4a42":t.tone==="warn"?"#d89a2b":"#3aa974";return(()=>{var r=V(),s=i;return typeof s=="function"?e.use(s,r):i=r,e.insert(r,e.createComponent(p.For,{each:D,children:c=>(()=>{var d=O();return e.setAttribute(d,"x",c*3),e.effect(g=>{var f=c<y(t.remaining)?a():"currentColor",h=c<y(t.remaining)?"1":"0.12";return f!==g.e&&e.setAttribute(d,"fill",g.e=f),h!==g.t&&e.setAttribute(d,"fill-opacity",g.t=h),g},{e:void 0,t:void 0}),d})()})),r})()},F=t=>{const i=()=>t.tone==="danger"?"#cf4a42":t.tone==="warn"?"#d89a2b":"#3aa974";return(()=>{var n=X();return e.insert(n,e.createComponent(p.For,{each:I,children:a=>(()=>{var r=O();return e.setAttribute(r,"x",a*3),e.effect(s=>{var c=a<y(t.remaining,w)?i():"currentColor",d=a<y(t.remaining,w)?"1":"0.12";return c!==s.e&&e.setAttribute(r,"fill",s.e=c),d!==s.t&&e.setAttribute(r,"fill-opacity",s.t=d),s},{e:void 0,t:void 0}),r})()})),n})()},L=t=>e.createComponent(C.Dialog,{title:"OpenCode Go 额度",size:"normal",get footer(){return[e.createComponent(C.Button,{variant:"ghost",onClick:()=>o.system.openExternal(ie),children:"打开控制台"}),e.createComponent(C.Button,{variant:"contrast",get onClick(){return t.close},children:"关闭"})]},get children(){return e.createComponent(p.Show,{get when(){return $()},get fallback(){return(()=>{var i=Y();return e.insert(i,(()=>{var n=e.memo(()=>!!l());return()=>n()?"正在读取…":G(A())})()),i})()},get children(){var i=Q(),n=i.firstChild,a=n.nextSibling,r=a.nextSibling,s=r.firstChild,c=s.nextSibling;return e.insert(i,e.createComponent(p.For,{get each(){return x()},children:d=>(()=>{var g=Z(),f=g.firstChild,h=f.nextSibling,U=h.firstChild,W=h.nextSibling;return e.insert(f,()=>d.label),e.insert(g,e.createComponent(F,{get remaining(){return d.remaining},get tone(){return e.memo(()=>v().tone==="ok")()?void 0:v().tone}}),h),e.insert(h,()=>Math.round(d.remaining),U),e.insert(W,(()=>{var H=e.memo(()=>!!d.limited);return()=>H()?"已限流":j(d.resetsAt)})()),g})()}),r),e.insert(c,()=>q().detail),i}})}}),z=()=>{o.dialogs.open(t=>e.createComponent(L,{get close(){return t.close}}))},K=()=>(()=>{var t=te(),i=t.firstChild;return i.firstChild,i.$$click=()=>z(),e.insert(i,e.createComponent(p.Show,{get when(){return x().length>0},get fallback(){return[(()=>{var n=ne();return e.insert(n,(()=>{var a=e.memo(()=>!!l());return()=>a()?"读取中…":G(A())})()),n})(),R()]},get children(){return[ee(),e.createComponent(p.For,{get each(){return x()},children:n=>(()=>{var a=re(),r=a.firstChild;return e.insert(r,()=>n.short),e.insert(a,e.createComponent(P,{get remaining(){return n.remaining},get tone(){return e.memo(()=>v().tone==="ok")()?void 0:v().tone}}),null),e.effect(()=>e.setAttribute(a,"title",`${n.label} · ${S(n)}`)),a})()}),R()]}}),null),e.effect(n=>{var a=v().tone,r=`OpenCode Go，${v().text}`,s=x().map(c=>`${c.label} ${S(c)}`).join(" · ");return a!==n.e&&e.setAttribute(i,"data-tone",n.e=a),r!==n.t&&e.setAttribute(i,"aria-label",n.t=r),s!==n.a&&e.setAttribute(i,"title",n.a=s),n},{e:void 0,t:void 0,a:void 0}),t})();o.add(b.Style,ae),o.add(b.Command,()=>({id:"show",title:"OpenCode Go 额度",keywords:"go usage quota allowance 额度",run:()=>z()})),o.add(b.Slot,{at:"window.bottom",render:()=>e.createComponent(K,{})})}});e.delegateEvents(["click"]);exports.default=ce;
