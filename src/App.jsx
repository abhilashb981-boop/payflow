import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

const SEED_USERS = [
  { id:1, name:"Admin User",    email:"admin@co.com",    pwd:"admin123", role:"admin",      dept:null,         status:"active" },
  { id:2, name:"John Manager",  email:"manager@co.com",  pwd:"pass123",  role:"manager",    dept:null,         status:"active" },
  { id:3, name:"Sarah Finance", email:"finance@co.com",  pwd:"pass123",  role:"finance",    dept:null,         status:"active" },
  { id:4, name:"Tom Treasury",  email:"treasury@co.com", pwd:"pass123",  role:"treasury",   dept:null,         status:"active" },
  { id:5, name:"Alice Smith",   email:"alice@co.com",    pwd:"pass123",  role:"department", dept:"IT",         status:"active" },
  { id:6, name:"Bob Jones",     email:"bob@co.com",      pwd:"pass123",  role:"department", dept:"HR",         status:"active" },
  { id:7, name:"Carol White",   email:"carol@co.com",    pwd:"pass123",  role:"department", dept:"Facilities", status:"active" },
  { id:8, name:"David Brown",   email:"david@co.com",    pwd:"pass123",  role:"department", dept:"Marketing",  status:"active" },
];
const SEED_REQS = [
  { id:1, uid:5, uname:"Alice Smith",  dept:"IT",         vendor:"TechSupplies Inc",  amt:15000, desc:"Server hardware purchase",    inv:"INV-2024-001.pdf", status:"pending",   date:"2026-02-28", mgrNote:"",                       finNote:"",                 trsNote:"" },
  { id:2, uid:6, uname:"Bob Jones",    dept:"HR",         vendor:"TrainingCo",        amt:8500,  desc:"Employee training materials", inv:"INV-2024-002.pdf", status:"approved",  date:"2026-02-25", mgrNote:"Approved for Q1 training", finNote:"",                 trsNote:"" },
  { id:3, uid:7, uname:"Carol White",  dept:"Facilities", vendor:"CleanPro Services", amt:3200,  desc:"Monthly cleaning contract",   inv:"INV-2024-003.pdf", status:"initiated", date:"2026-02-20", mgrNote:"Approved",                finNote:"Payment via NEFT", trsNote:"" },
  { id:4, uid:8, uname:"David Brown",  dept:"Marketing",  vendor:"AdAgency Pro",      amt:45000, desc:"Q1 Marketing Campaign",       inv:"INV-2024-004.pdf", status:"paid",      date:"2026-02-15", mgrNote:"Approved",                finNote:"Processed",        trsNote:"Wire transfer TXN#8821" },
];

const DEPTS = ["IT","HR","Facilities","Marketing"];
const ROLES = ["department","manager","finance","treasury","admin"];
const fmt = n => "₹"+Number(n).toLocaleString("en-IN");
const tdy = () => new Date().toISOString().split("T")[0];
let nxtId = 300;

// ── localStorage HOOK ─────────────────────────────────────────────────────
function useLocalState(key, seed) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : seed;
    } catch { return seed; }
  });
  const set = val => {
    const next = typeof val === "function" ? val(state) : val;
    setState(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch(e) { console.error(e); }
  };
  return [state, set];
}

// ── UI HELPERS ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:   { label:"Pending Approval",  cls:"bg-yellow-100 text-yellow-700" },
  approved:  { label:"Manager Approved",  cls:"bg-blue-100 text-blue-700"    },
  rejected:  { label:"Rejected",          cls:"bg-red-100 text-red-700"      },
  initiated: { label:"Payment Initiated", cls:"bg-purple-100 text-purple-700"},
  paid:      { label:"Paid",              cls:"bg-green-100 text-green-700"  },
};
const Badge = ({ status }) => {
  const s = STATUS_MAP[status]||{label:status,cls:"bg-gray-100 text-gray-600"};
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>;
};
const StatCard = ({ title, value, color }) => (
  <div className={`rounded-xl p-4 text-white ${color}`}>
    <p className="text-xs opacity-75 uppercase tracking-wide">{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);
const FInput = ({ label, ...p }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
    <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...p}/>
  </div>
);
const FSelect = ({ label, children, ...p }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
    <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" {...p}>{children}</select>
  </div>
);
const FTextarea = ({ label, ...p }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} {...p}/>
  </div>
);
const PageTitle = ({ title, sub }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    {sub&&<p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
  </div>
);
const Empty = ({ icon, msg, sub }) => (
  <div className="text-center py-16">
    <div className="text-5xl mb-3">{icon}</div>
    <p className="font-semibold text-gray-600">{msg}</p>
    {sub&&<p className="text-sm text-gray-400 mt-1">{sub}</p>}
  </div>
);
const WorkflowSteps = ({ status }) => {
  const steps=["Submitted","Approved","Initiated","Paid"];
  const idx={pending:0,rejected:0,approved:1,initiated:2,paid:3};
  const cur=idx[status]??0, rej=status==="rejected";
  return (
    <div className="flex items-center gap-0.5 mt-3 flex-wrap">
      {steps.map((s,i)=>{
        const done=!rej&&i<=cur, active=!rej&&i===cur;
        return <div key={s} className="flex items-center gap-0.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active?"bg-blue-500":done?"bg-green-500":"bg-gray-200"}`}/>
          <span className={`text-xs ${active?"text-blue-600 font-semibold":done?"text-green-600":"text-gray-400"}`}>{s}</span>
          {i<3&&<div className={`w-4 h-px mx-0.5 ${i<cur&&!rej?"bg-green-400":"bg-gray-200"}`}/>}
        </div>;
      })}
      {rej&&<span className="text-xs text-red-500 ml-2 font-semibold">✗ Rejected</span>}
    </div>
  );
};
const MiniRow = ({ r }) => (
  <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
    <span className="text-lg">{r.status==="paid"?"💰":r.status==="initiated"?"🔄":r.status==="approved"?"✅":r.status==="rejected"?"❌":"⏳"}</span>
    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{r.vendor}</p><p className="text-xs text-gray-400">{r.dept} · {r.date}</p></div>
    <div className="text-right flex-shrink-0"><p className="text-sm font-bold text-gray-700">{fmt(r.amt)}</p><Badge status={r.status}/></div>
  </div>
);

function ReqCard({ r, actions }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1"><span className="font-bold text-gray-800">{r.vendor}</span><Badge status={r.status}/></div>
          <p className="text-sm text-gray-500 mb-2">{r.desc}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
            <span>👤 {r.uname}</span><span>🏢 {r.dept}</span><span>📅 {r.date}</span><span>📎 {r.inv}</span>
          </div>
          {r.mgrNote&&<p className="text-xs text-blue-600 mt-1.5">💬 Manager: {r.mgrNote}</p>}
          {r.finNote&&<p className="text-xs text-purple-600 mt-0.5">💬 Finance: {r.finNote}</p>}
          {r.trsNote&&<p className="text-xs text-green-600 mt-0.5">💬 Treasury: {r.trsNote}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-gray-800">{fmt(r.amt)}</p>
          <div className="flex flex-col gap-1 mt-2">
            {actions}
            <button onClick={()=>setOpen(true)} className="text-xs text-blue-500 hover:underline">Details</button>
          </div>
        </div>
      </div>
      {open&&<Modal title="Request Details" onClose={()=>setOpen(false)}>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">{[["Vendor",r.vendor],["Amount",fmt(r.amt)],["Department",r.dept],["Date",r.date],["Requester",r.uname],["Invoice",r.inv]].map(([l,v])=><div key={l}><p className="text-xs text-gray-400 uppercase">{l}</p><p className="font-semibold text-gray-800">{v}</p></div>)}</div>
          <div><p className="text-xs text-gray-400 uppercase">Description</p><p className="text-gray-700">{r.desc}</p></div>
          <Badge status={r.status}/>
          {r.mgrNote&&<div className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-blue-400 mb-0.5">Manager Note</p><p>{r.mgrNote}</p></div>}
          {r.finNote&&<div className="bg-purple-50 rounded-lg p-3"><p className="text-xs text-purple-400 mb-0.5">Finance Note</p><p>{r.finNote}</p></div>}
          {r.trsNote&&<div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-green-400 mb-0.5">Treasury Note</p><p>{r.trsNote}</p></div>}
          <WorkflowSteps status={r.status}/>
        </div>
      </Modal>}
    </div>
  );
}

// ── ADMIN ─────────────────────────────────────────────────────────────────
function AdminView({tab,users,setUsers,invites,setInvites,reqs,notify}){
  if(tab==="dashboard")    return <AdminDash users={users} reqs={reqs}/>;
  if(tab==="users")        return <AdminUsers users={users} setUsers={setUsers} notify={notify}/>;
  if(tab==="invites")      return <AdminInvite invites={invites} setInvites={setInvites} users={users} setUsers={setUsers} notify={notify}/>;
  if(tab==="all_requests") return <AdminAllReqs reqs={reqs}/>;
  return null;
}
function AdminDash({users,reqs}){
  const p=reqs.filter(r=>r.status==="pending").length,pd=reqs.filter(r=>r.status==="paid"),act=users.filter(u=>u.status==="active").length;
  return <>
    <PageTitle title="Admin Dashboard" sub="System-wide overview"/>
    <div className="grid grid-cols-2 gap-3 mb-6">
      <StatCard title="Active Users" value={act} color="bg-blue-600"/>
      <StatCard title="Pending Approvals" value={p} color="bg-yellow-500"/>
      <StatCard title="Payments Completed" value={pd.length} color="bg-green-600"/>
      <StatCard title="Total Paid Out" value={fmt(pd.reduce((s,r)=>s+r.amt,0))} color="bg-indigo-600"/>
    </div>
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="font-bold text-gray-700 mb-4">User Roles Distribution</h3>
      {ROLES.map(role=>{const c=users.filter(u=>u.role===role&&u.status==="active").length;return(
        <div key={role} className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-600 capitalize w-24">{role}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{width:`${Math.min(c*20,100)}%`}}/></div>
          <span className="text-sm font-bold text-gray-600 w-5">{c}</span>
        </div>
      );})}
    </div>
  </>;
}
function AdminUsers({users,setUsers,notify}){
  const [editing,setEditing]=useState(null),[form,setForm]=useState({});
  const save=id=>{setUsers(us=>us.map(u=>u.id===id?{...u,...form}:u));setEditing(null);notify("User updated!");};
  const toggle=id=>{setUsers(us=>us.map(u=>u.id===id?{...u,status:u.status==="active"?"inactive":"active"}:u));notify("Status updated.");};
  return <>
    <PageTitle title="Users & Roles" sub="Manage team members and permissions"/>
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase"><tr>{["Name","Email","Role","Dept","Status","Actions"].map(h=><th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-50">{users.map(u=>(
          <tr key={u.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{u.name}</td>
            <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
            <td className="px-4 py-3">{editing===u.id?<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="border rounded px-2 py-1 text-xs">{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select>:<span className="capitalize">{u.role}</span>}</td>
            <td className="px-4 py-3">{editing===u.id?<select value={form.dept||""} onChange={e=>setForm({...form,dept:e.target.value||null})} className="border rounded px-2 py-1 text-xs"><option value="">None</option>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</select>:u.dept||"—"}</td>
            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.status==="active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{u.status}</span></td>
            <td className="px-4 py-3"><div className="flex gap-1">{editing===u.id
              ?<><button onClick={()=>save(u.id)} className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg">Save</button><button onClick={()=>setEditing(null)} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">Cancel</button></>
              :<><button onClick={()=>{setEditing(u.id);setForm({role:u.role,dept:u.dept});}} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg">Edit</button><button onClick={()=>toggle(u.id)} className={`text-xs px-2.5 py-1 rounded-lg ${u.status==="active"?"bg-red-50 text-red-600":"bg-green-50 text-green-600"}`}>{u.status==="active"?"Deactivate":"Activate"}</button></>
            }</div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </>;
}
function AdminInvite({invites,setInvites,users,setUsers,notify}){
  const [f,setF]=useState({name:"",email:"",role:"department",dept:"IT"}),[creds,setCreds]=useState(null);
  const send=()=>{
    if(!f.name||!f.email){notify("Fill all fields",false);return;}
    if(users.find(u=>u.email===f.email)){notify("Email already exists",false);return;}
    const pwd="Tmp@"+Math.floor(1000+Math.random()*9000);
    const nu={id:++nxtId,name:f.name,email:f.email,pwd,role:f.role,dept:f.role==="department"?f.dept:null,status:"active"};
    setUsers(us=>[...us,nu]);
    setInvites(iv=>[...iv,{...nu,invitedAt:tdy()}]);
    setF({name:"",email:"",role:"department",dept:"IT"});
    setCreds({name:f.name,email:f.email,pwd});
  };
  return <>
    <PageTitle title="Invite Users" sub="Add new members and assign their role"/>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-700 mb-4">New Invitation</h3>
        <div className="space-y-3">
          <FInput label="Full Name *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Jane Doe"/>
          <FInput label="Email *" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="jane@company.com"/>
          <FSelect label="Assign Role" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}</FSelect>
          {f.role==="department"&&<FSelect label="Department" value={f.dept} onChange={e=>setF({...f,dept:e.target.value})}>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</FSelect>}
          <button onClick={send} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm">Send Invite & Create Account</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-700 mb-4">Sent Invites ({invites.length})</h3>
        {invites.length===0?<Empty icon="📬" msg="No invites sent yet"/>:
          <div className="space-y-2 max-h-72 overflow-y-auto">{invites.map(iv=>(
            <div key={iv.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">{iv.name[0]}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{iv.name}</p><p className="text-xs text-gray-400 capitalize">{iv.role}{iv.dept?` · ${iv.dept}`:""}</p></div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </div>
          ))}</div>}
      </div>
    </div>
    {creds&&<Modal title="Account Created ✅" onClose={()=>setCreds(null)}>
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">🎉</div>
        <p className="text-sm text-gray-600">Share these credentials with <strong>{creds.name}</strong></p>
        <div className="bg-gray-50 border rounded-xl p-4 text-left space-y-2 text-sm">
          <p><span className="text-gray-400">Email:</span> <strong>{creds.email}</strong></p>
          <p><span className="text-gray-400">Password:</span> <strong>{creds.pwd}</strong></p>
        </div>
        <p className="text-xs text-gray-400">Ask the user to change their password after first login.</p>
        <button onClick={()=>setCreds(null)} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm">Done</button>
      </div>
    </Modal>}
  </>;
}
function AdminAllReqs({reqs}){
  const [f,setF]=useState("all");
  const list=f==="all"?reqs:reqs.filter(r=>r.status===f);
  return <>
    <PageTitle title="All Requests" sub="Complete payment request audit trail"/>
    <div className="flex flex-wrap gap-2 mb-4">
      {["all","pending","approved","initiated","paid","rejected"].map(s=>(
        <button key={s} onClick={()=>setF(s)} className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold transition ${f===s?"bg-blue-600 text-white shadow":"bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
          {s} ({s==="all"?reqs.length:reqs.filter(r=>r.status===s).length})
        </button>
      ))}
    </div>
    {list.length===0?<Empty icon="🔍" msg="No requests found"/>:<div className="space-y-3">{list.map(r=><ReqCard key={r.id} r={r} actions={null}/>)}</div>}
  </>;
}

// ── MANAGER ───────────────────────────────────────────────────────────────
function ManagerView({tab,reqs,updateReq,notify}){
  if(tab==="dashboard") return <ManagerDash reqs={reqs}/>;
  if(tab==="pending")   return <ManagerPending reqs={reqs} updateReq={updateReq} notify={notify}/>;
  if(tab==="history")   return <GenHistory reqs={reqs.filter(r=>["approved","rejected","initiated","paid"].includes(r.status))} title="Approval History"/>;
  return null;
}
function ManagerDash({reqs}){
  const p=reqs.filter(r=>r.status==="pending"),a=reqs.filter(r=>["approved","initiated","paid"].includes(r.status)),rj=reqs.filter(r=>r.status==="rejected");
  return <>
    <PageTitle title="Manager Dashboard" sub="Review and action payment requests"/>
    <div className="grid grid-cols-2 gap-3 mb-6">
      <StatCard title="Pending Review" value={p.length} color="bg-yellow-500"/>
      <StatCard title="Approved" value={a.length} color="bg-blue-600"/>
      <StatCard title="Rejected" value={rj.length} color="bg-red-500"/>
      <StatCard title="Pending Amount" value={fmt(p.reduce((s,r)=>s+r.amt,0))} color="bg-indigo-600"/>
    </div>
    {reqs.length>0&&<div className="bg-white rounded-xl shadow-sm p-4"><h3 className="font-bold text-gray-700 mb-3">Recent Requests</h3><div className="space-y-2">{reqs.slice(-3).reverse().map(r=><MiniRow key={r.id} r={r}/>)}</div></div>}
  </>;
}
function ManagerPending({reqs,updateReq,notify}){
  const pending=reqs.filter(r=>r.status==="pending");
  const [sel,setSel]=useState(null),[note,setNote]=useState(""),[act,setAct]=useState("");
  const go=()=>{updateReq(sel.id,{status:act==="approve"?"approved":"rejected",mgrNote:note});setSel(null);setNote("");setAct("");notify(act==="approve"?"Request approved! ✅":"Request rejected.");};
  return <>
    <PageTitle title="Pending Approvals" sub={`${pending.length} request(s) awaiting your decision`}/>
    {pending.length===0?<Empty icon="✅" msg="All caught up!" sub="No pending requests right now."/>:
      <div className="space-y-3">{pending.map(r=><ReqCard key={r.id} r={r} actions={
        <div className="flex gap-1">
          <button onClick={()=>{setSel(r);setAct("approve");}} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold">Approve</button>
          <button onClick={()=>{setSel(r);setAct("reject");}} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold">Reject</button>
        </div>
      }/>)}</div>}
    {sel&&<Modal title={act==="approve"?"Approve Request":"Reject Request"} onClose={()=>setSel(null)}>
      <div className="space-y-3">
        <div className={`rounded-xl p-3 text-sm ${act==="approve"?"bg-green-50":"bg-red-50"}`}><p className="font-bold text-gray-800">{sel.vendor}</p><p className="text-gray-500">{fmt(sel.amt)} · {sel.dept}</p></div>
        <FTextarea label={act==="approve"?"Note (optional)":"Rejection Reason *"} value={note} onChange={e=>setNote(e.target.value)} placeholder={act==="approve"?"Add any comments...":"Please state the reason..."}/>
        <div className="flex gap-2">
          <button onClick={go} className={`flex-1 text-white font-bold py-2.5 rounded-xl text-sm ${act==="approve"?"bg-green-600 hover:bg-green-700":"bg-red-600 hover:bg-red-700"}`}>{act==="approve"?"Confirm Approval":"Confirm Rejection"}</button>
          <button onClick={()=>setSel(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
        </div>
      </div>
    </Modal>}
  </>;
}

// ── FINANCE ───────────────────────────────────────────────────────────────
function FinanceView({tab,reqs,updateReq,notify}){
  if(tab==="dashboard") return <FinanceDash reqs={reqs}/>;
  if(tab==="report")    return <FinanceReport reqs={reqs} updateReq={updateReq} notify={notify}/>;
  if(tab==="history")   return <GenHistory reqs={reqs.filter(r=>["initiated","paid"].includes(r.status))} title="Finance History"/>;
  return null;
}
function FinanceDash({reqs}){
  const a=reqs.filter(r=>r.status==="approved"),i=reqs.filter(r=>r.status==="initiated"),p=reqs.filter(r=>r.status==="paid");
  return <>
    <PageTitle title="Finance Dashboard" sub="Payment processing and initiation"/>
    <div className="grid grid-cols-2 gap-3 mb-6">
      <StatCard title="Awaiting Initiation" value={a.length} color="bg-blue-600"/>
      <StatCard title="Initiated" value={i.length} color="bg-purple-600"/>
      <StatCard title="Paid" value={p.length} color="bg-green-600"/>
      <StatCard title="Total Initiated" value={fmt([...i,...p].reduce((s,r)=>s+r.amt,0))} color="bg-indigo-600"/>
    </div>
    {reqs.length>0&&<div className="bg-white rounded-xl shadow-sm p-4"><h3 className="font-bold text-gray-700 mb-3">Recent Activity</h3><div className="space-y-2">{reqs.filter(r=>["approved","initiated","paid"].includes(r.status)).slice(-3).reverse().map(r=><MiniRow key={r.id} r={r}/>)}</div></div>}
  </>;
}
function FinanceReport({reqs,updateReq,notify}){
  const approved=reqs.filter(r=>r.status==="approved");
  const [sel,setSel]=useState(null),[note,setNote]=useState("");
  const go=()=>{updateReq(sel.id,{status:"initiated",finNote:note||"Payment initiated"});setSel(null);setNote("");notify("Payment marked as initiated! 🔄");};
  return <>
    <PageTitle title="Payment Report" sub="Approved requests ready for payment initiation"/>
    {approved.length===0?<Empty icon="📊" msg="No approved requests pending" sub="Manager-approved requests will appear here."/>:
      <div className="space-y-3">{approved.map(r=><ReqCard key={r.id} r={r} actions={<button onClick={()=>setSel(r)} className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap">Initiate Payment</button>}/>)}</div>}
    {sel&&<Modal title="Initiate Payment" onClose={()=>setSel(null)}>
      <div className="space-y-3">
        <div className="bg-purple-50 rounded-xl p-3 text-sm"><p className="font-bold text-purple-800">{sel.vendor}</p><p className="text-purple-500">{fmt(sel.amt)} · {sel.dept}</p></div>
        <FTextarea label="Payment Reference / Mode" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. NEFT | Ref No. 2024XXXX"/>
        <div className="flex gap-2">
          <button onClick={go} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-sm">Mark as Initiated</button>
          <button onClick={()=>setSel(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
        </div>
      </div>
    </Modal>}
  </>;
}

// ── TREASURY ──────────────────────────────────────────────────────────────
function TreasuryView({tab,reqs,updateReq,notify}){
  if(tab==="dashboard") return <TreasuryDash reqs={reqs}/>;
  if(tab==="initiated") return <TreasuryInitiated reqs={reqs} updateReq={updateReq} notify={notify}/>;
  if(tab==="history")   return <GenHistory reqs={reqs.filter(r=>r.status==="paid")} title="Payment History"/>;
  return null;
}
function TreasuryDash({reqs}){
  const i=reqs.filter(r=>r.status==="initiated"),p=reqs.filter(r=>r.status==="paid");
  return <>
    <PageTitle title="Treasury Dashboard" sub="Final payment execution and confirmation"/>
    <div className="grid grid-cols-2 gap-3 mb-6">
      <StatCard title="Awaiting Payment" value={i.length} color="bg-purple-600"/>
      <StatCard title="Completed" value={p.length} color="bg-green-600"/>
      <StatCard title="Pending Amount" value={fmt(i.reduce((s,r)=>s+r.amt,0))} color="bg-yellow-500"/>
      <StatCard title="Total Paid" value={fmt(p.reduce((s,r)=>s+r.amt,0))} color="bg-blue-600"/>
    </div>
    {reqs.length>0&&<div className="bg-white rounded-xl shadow-sm p-4"><h3 className="font-bold text-gray-700 mb-3">Recent Activity</h3><div className="space-y-2">{reqs.filter(r=>["initiated","paid"].includes(r.status)).slice(-3).reverse().map(r=><MiniRow key={r.id} r={r}/>)}</div></div>}
  </>;
}
function TreasuryInitiated({reqs,updateReq,notify}){
  const initiated=reqs.filter(r=>r.status==="initiated");
  const [sel,setSel]=useState(null),[note,setNote]=useState("");
  const go=()=>{updateReq(sel.id,{status:"paid",trsNote:note||"Payment completed"});setSel(null);setNote("");notify("Payment marked as PAID! 💰");};
  return <>
    <PageTitle title="Initiated Payments" sub="Payments ready for final confirmation"/>
    {initiated.length===0?<Empty icon="💰" msg="No payments awaiting execution" sub="Finance-initiated payments will appear here."/>:
      <div className="space-y-3">{initiated.map(r=><ReqCard key={r.id} r={r} actions={<button onClick={()=>setSel(r)} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap">Mark as Paid</button>}/>)}</div>}
    {sel&&<Modal title="Confirm Payment Completed" onClose={()=>setSel(null)}>
      <div className="space-y-3">
        <div className="bg-green-50 rounded-xl p-3 text-sm"><p className="font-bold text-green-800">{sel.vendor}</p><p className="text-green-500">{fmt(sel.amt)} · {sel.dept}</p></div>
        <FTextarea label="Transaction ID / Reference" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Wire Ref. TXN#8821"/>
        <div className="flex gap-2">
          <button onClick={go} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm">Confirm Payment Paid</button>
          <button onClick={()=>setSel(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
        </div>
      </div>
    </Modal>}
  </>;
}

// ── DEPARTMENT ────────────────────────────────────────────────────────────
function DeptView({tab,reqs,setReqs,user,notify}){
  if(tab==="dashboard")   return <DeptDash reqs={reqs} user={user}/>;
  if(tab==="new_request") return <DeptNew setReqs={setReqs} user={user} notify={notify}/>;
  if(tab==="my_requests") return <DeptMine reqs={reqs} user={user}/>;
  return null;
}
function DeptDash({reqs,user}){
  const mine=reqs.filter(r=>r.uid===user.id),p=mine.filter(r=>r.status==="pending"),done=mine.filter(r=>r.status==="paid");
  return <>
    <PageTitle title={`${user.dept} Department`} sub={`Welcome, ${user.name}`}/>
    <div className="grid grid-cols-2 gap-3 mb-6">
      <StatCard title="My Total Requests" value={mine.length} color="bg-blue-600"/>
      <StatCard title="Pending Approval" value={p.length} color="bg-yellow-500"/>
      <StatCard title="Paid" value={done.length} color="bg-green-600"/>
      <StatCard title="Total Requested" value={fmt(mine.reduce((s,r)=>s+r.amt,0))} color="bg-indigo-600"/>
    </div>
    {mine.length>0&&<div className="bg-white rounded-xl shadow-sm p-4"><h3 className="font-bold text-gray-700 mb-3">My Recent Requests</h3><div className="space-y-2">{mine.slice(-3).reverse().map(r=><MiniRow key={r.id} r={r}/>)}</div></div>}
  </>;
}
function DeptNew({setReqs,user,notify}){
  const [f,setF]=useState({vendor:"",amt:"",desc:"",inv:""});
  const submit=()=>{
    if(!f.vendor||!f.amt||!f.desc){notify("Please fill all required fields",false);return;}
    setReqs(rs=>[...rs,{id:++nxtId,uid:user.id,uname:user.name,dept:user.dept,vendor:f.vendor,amt:Number(f.amt),desc:f.desc,inv:f.inv||"No invoice attached",status:"pending",date:tdy(),mgrNote:"",finNote:"",trsNote:""}]);
    setF({vendor:"",amt:"",desc:"",inv:""});
    notify("Payment request submitted! 🎉");
  };
  return <>
    <PageTitle title="New Payment Request"/>
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
      <div className="space-y-4">
        <FInput label="Vendor / Company Name *" value={f.vendor} onChange={e=>setF({...f,vendor:e.target.value})} placeholder="e.g. TechSupplies Inc."/>
        <FInput label="Amount (₹) *" type="number" value={f.amt} onChange={e=>setF({...f,amt:e.target.value})} placeholder="0.00"/>
        <FTextarea label="Description / Purpose *" value={f.desc} onChange={e=>setF({...f,desc:e.target.value})} placeholder="Describe what this payment is for..."/>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Invoice Reference</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
            <p className="text-center text-sm text-gray-400 mb-2">📎 Invoice Number or File Name</p>
            <input className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="e.g. INV-2024-055.pdf" value={f.inv} onChange={e=>setF({...f,inv:e.target.value})}/>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
          <strong>Approval Workflow:</strong> Your Request → Manager Approval → Finance Initiation → Treasury Payment
        </div>
        <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm">Submit Payment Request</button>
      </div>
    </div>
  </>;
}
function DeptMine({reqs,user}){
  const mine=reqs.filter(r=>r.uid===user.id);
  return <>
    <PageTitle title="My Requests" sub="Track the status of your payment requests"/>
    {mine.length===0?<Empty icon="📋" msg="No requests yet" sub="Submit your first payment request."/>:
      <div className="space-y-3">{mine.slice().reverse().map(r=>(
        <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1"><span className="font-bold text-gray-800">{r.vendor}</span><Badge status={r.status}/></div>
              <p className="text-sm text-gray-500 mb-1">{r.desc}</p>
              <p className="text-xs text-gray-400">📅 {r.date} · 📎 {r.inv}</p>
              <WorkflowSteps status={r.status}/>
              {r.mgrNote&&<p className="text-xs text-blue-600 mt-1">💬 Manager: {r.mgrNote}</p>}
              {r.finNote&&<p className="text-xs text-purple-600 mt-0.5">💬 Finance: {r.finNote}</p>}
              {r.trsNote&&<p className="text-xs text-green-600 mt-0.5">💬 Treasury: {r.trsNote}</p>}
            </div>
            <p className="text-xl font-bold text-gray-800 flex-shrink-0">{fmt(r.amt)}</p>
          </div>
        </div>
      ))}</div>}
  </>;
}
function GenHistory({reqs,title}){
  return <>
    <PageTitle title={title} sub={`${reqs.length} record(s)`}/>
    {reqs.length===0?<Empty icon="📁" msg="No records yet"/>:<div className="space-y-3">{reqs.slice().reverse().map(r=><ReqCard key={r.id} r={r} actions={null}/>)}</div>}
  </>;
}

// ── NAV & SHELL ───────────────────────────────────────────────────────────
const NAV_MAP = {
  admin:      [["dashboard","🏠 Dashboard"],["users","👥 Users & Roles"],["invites","✉️ Invite Users"],["all_requests","📋 All Requests"]],
  manager:    [["dashboard","🏠 Dashboard"],["pending","⏳ Pending Approvals"],["history","📁 History"]],
  finance:    [["dashboard","🏠 Dashboard"],["report","📊 Payment Report"],["history","📁 History"]],
  treasury:   [["dashboard","🏠 Dashboard"],["initiated","🔄 Initiated Payments"],["history","📁 History"]],
  department: [["dashboard","🏠 Dashboard"],["new_request","➕ New Request"],["my_requests","📋 My Requests"]],
};
function MainApp({user,users,setUsers,reqs,setReqs,invites,setInvites,tab,setTab,notify,onLogout}){
  const updateReq=(id,patch)=>setReqs(rs=>rs.map(r=>r.id===id?{...r,...patch}:r));
  const nav=NAV_MAP[user.role]||[];
  const pendingCount=reqs.filter(r=>r.status==="pending").length;
  const initiatedCount=reqs.filter(r=>r.status==="initiated").length;
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-56 bg-gradient-to-b from-slate-900 to-blue-900 text-white flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💳</div>
            <div><p className="font-black text-base tracking-tight">PayFlow</p><p className="text-xs text-blue-300">Workflow Tool</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(([key,label])=>{
            const badge=(key==="pending"&&pendingCount>0)?pendingCount:(key==="initiated"&&initiatedCount>0)?initiatedCount:null;
            return <button key={key} onClick={()=>setTab(key)} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-center justify-between ${tab===key?"bg-white/20 font-bold text-white":"hover:bg-white/10 text-blue-100"}`}>
              <span>{label}</span>
              {badge&&<span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">{badge}</span>}
            </button>;
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-black flex-shrink-0">{user.name[0]}</div>
            <div className="min-w-0"><p className="text-xs font-bold text-white truncate">{user.name}</p><p className="text-xs text-blue-300 capitalize truncate">{user.role}{user.dept?` · ${user.dept}`:""}</p></div>
          </div>
          <button onClick={onLogout} className="w-full text-xs text-blue-200 hover:text-white hover:bg-white/10 py-1.5 px-2 rounded-lg transition text-left">↩ Sign out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          {user.role==="admin"      &&<AdminView    tab={tab} users={users} setUsers={setUsers} invites={invites} setInvites={setInvites} reqs={reqs} notify={notify}/>}
          {user.role==="manager"    &&<ManagerView  tab={tab} reqs={reqs} updateReq={updateReq} notify={notify}/>}
          {user.role==="finance"    &&<FinanceView  tab={tab} reqs={reqs} updateReq={updateReq} notify={notify}/>}
          {user.role==="treasury"   &&<TreasuryView tab={tab} reqs={reqs} updateReq={updateReq} notify={notify}/>}
          {user.role==="department" &&<DeptView     tab={tab} reqs={reqs} setReqs={setReqs} user={user} notify={notify}/>}
        </div>
      </main>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────
function LoginPage({users,onLogin}){
  const [email,setEmail]=useState(""),[pwd,setPwd]=useState(""),[err,setErr]=useState("");
  const login=()=>{
    const u=users.find(u=>u.email===email&&u.pwd===pwd&&u.status==="active");
    if(u) onLogin(u); else setErr("Invalid credentials or account inactive.");
  };
  const hints=[
    {label:"Admin",e:"admin@co.com",p:"admin123"},
    {label:"Manager",e:"manager@co.com",p:"pass123"},
    {label:"Finance",e:"finance@co.com",p:"pass123"},
    {label:"Treasury",e:"treasury@co.com",p:"pass123"},
    {label:"IT Member",e:"alice@co.com",p:"pass123"},
    {label:"HR Member",e:"bob@co.com",p:"pass123"},
  ];
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg">💳</div>
          <h1 className="text-2xl font-black text-gray-800">PayFlow</h1>
          <p className="text-gray-400 text-sm mt-0.5">Payment Approval Workflow</p>
        </div>
        <div className="space-y-3">
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}/>
          {err&&<p className="text-red-500 text-xs text-center">{err}</p>}
          <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm shadow">Sign In</button>
        </div>
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3">Quick Demo Login</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {hints.map(h=><button key={h.label} onClick={()=>{setEmail(h.e);setPwd(h.p);setErr("");}} className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-3 py-1.5 rounded-full transition font-medium border border-transparent hover:border-blue-200">{h.label}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────
function App() {
  const [users,   setUsers]   = useLocalState("pf:users",    SEED_USERS);
  const [reqs,    setReqs]    = useLocalState("pf:requests", SEED_REQS);
  const [invites, setInvites] = useLocalState("pf:invites",  []);
  const [user,    setUser]    = useState(null);
  const [tab,     setTab]     = useState("dashboard");
  const [toast,   setToast]   = useState(null);
  const notify=(msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3500);};
  return (
    <div className="font-sans">
      {toast&&<div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold flex items-center gap-2 ${toast.ok?"bg-green-600":"bg-red-600"}`}><span>{toast.ok?"✓":"✗"}</span>{toast.msg}</div>}
      {!user
        ? <LoginPage users={users} onLogin={u=>{setUser(u);setTab("dashboard");}}/>
        : <MainApp user={user} users={users} setUsers={setUsers} reqs={reqs} setReqs={setReqs} invites={invites} setInvites={setInvites} tab={tab} setTab={setTab} notify={notify} onLogout={()=>{setUser(null);setTab("dashboard");}}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
