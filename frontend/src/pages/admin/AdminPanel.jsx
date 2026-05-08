import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TABS = [{id:'overview',label:'Overview'},{id:'users',label:'Users'},{id:'opportunities',label:'Opportunities'},{id:'applications',label:'Applications'}];

function ConfirmModal({message,onConfirm,onCancel}) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--space-4)' }}>
      <div className="card" style={{ maxWidth:360, width:'100%' }}>
        <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', marginBottom:8 }}>Confirm Action</p>
        <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', marginBottom:'var(--space-6)' }}>{message}</p>
        <div style={{ display:'flex', gap:'var(--space-3)' }}>
          <button onClick={onConfirm} className="btn btn-danger" style={{ flex:1, justifyContent:'center' }}>Confirm</button>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [opps, setOpps] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  useEffect(()=>{ if(!user||user.role!=='admin'){navigate('/dashboard');return;} fetchAll(); },[user]);

  const fetchAll = async()=>{
    setLoading(true);
    try{const [sr,ur,or,ar]=await Promise.all([adminAPI.getStats(),adminAPI.getUsers(),adminAPI.getOpportunities(),adminAPI.getApplications()]);setStats(sr.data);setUsers(ur.data.users||[]);setOpps(or.data.opportunities||[]);setApps(ar.data.applications||[]);}
    catch(e){console.error(e);}finally{setLoading(false);}
  };
  if(!user||user.role!=='admin') return null;

  const handleDeleteUser = id=>setConfirm({message:'Delete this user? All data will be removed.',onConfirm:async()=>{try{await adminAPI.deleteUser(id);setUsers(p=>p.filter(u=>u._id!==id));}catch(e){console.error(e);}setConfirm(null);},onCancel:()=>setConfirm(null)});
  const handleDeleteOpp = id=>setConfirm({message:'Delete this opportunity?',onConfirm:async()=>{try{await adminAPI.deleteOpportunity(id);setOpps(p=>p.filter(o=>o._id!==id));}catch(e){console.error(e);}setConfirm(null);},onCancel:()=>setConfirm(null)});
  const handleToggleOpp = async id=>{try{const r=await adminAPI.toggleOpportunity(id);setOpps(p=>p.map(o=>o._id===id?{...o,isActive:r.data.opportunity?.isActive}:o));}catch(e){console.error(e);}};
  const handleRoleChange = async(id,role)=>{try{await adminAPI.updateUser(id,{role});setUsers(p=>p.map(u=>u._id===id?{...u,role}:u));}catch(e){console.error(e);}};

  const TH = ({children}) => <th style={{ textAlign:'left', padding:'8px 16px', fontFamily:"'Geist'", fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-tertiary)', borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-elevated)' }}>{children}</th>;
  const TD = ({children,style}) => <td style={{ padding:'12px 16px', fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', borderBottom:'1px solid var(--border-subtle)', ...style }}>{children}</td>;

  return (
    <div className="page page-in">
      {confirm && <ConfirmModal {...confirm}/>}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-8)' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:4 }}>
            <span className="badge badge-red">ADMIN</span>
            <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.4rem,3vw,2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)' }}>Control Panel</h1>
          </div>
          <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)' }}>Logged in as <span style={{ color:'var(--text-primary)' }}>{user?.name}</span></p>
        </div>
        <button onClick={fetchAll} className="btn btn-secondary btn-sm">↻ Refresh</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:'var(--space-8)', borderBottom:'1px solid var(--border-subtle)' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'10px 20px', border:'none', borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`, background:'transparent', fontFamily:"'Geist'", fontWeight:500, fontSize:13.5, color:tab===t.id?'var(--text-accent)':'var(--text-tertiary)', cursor:'pointer', transition:'all var(--t-fast)', marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bento-grid"><div className="col-12 skeleton" style={{ height:200 }}/></div>
      ) : (
        <div className="page-in">
          {/* Overview */}
          {tab==='overview' && stats && (
            <div>
              <div className="bento-grid stagger" style={{ marginBottom:'var(--space-6)' }}>
                {[
                  {val:stats.totalUsers||0, label:'Total Users',       accent:'var(--accent)'},
                  {val:stats.students||0,   label:'Students',          accent:'var(--green)'},
                  {val:stats.companies||0,  label:'Companies',         accent:'var(--purple)'},
                  {val:stats.totalOpportunities||0, label:'Opportunities', accent:'var(--amber)'},
                  {val:stats.totalApplications||0,  label:'Applications',  accent:'var(--teal)'},
                  {val:stats.activeOpportunities||0, label:'Active Listings', accent:'var(--green)'},
                  {val:stats.verifiedUsers||0, label:'Verified Users',  accent:'var(--accent)'},
                  {val:stats.newToday||0,   label:'New Today',         accent:'var(--red)'},
                ].map((s,i)=>(
                  <div key={i} className="col-3 card card-sm">
                    <div style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:26, letterSpacing:'-0.04em', color:s.accent, lineHeight:1, marginBottom:6 }}>{s.val.toLocaleString()}</div>
                    <div style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bento-grid">
                {[{title:'Recent Users',data:users.slice(0,5),cols:['Name','Role']},{title:'Recent Listings',data:opps.slice(0,5),cols:['Role','Status']}].map((panel,pi)=>(
                  <div key={pi} className="col-6 card" style={{ padding:0 }}>
                    <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)' }}>{panel.title}</p>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <tbody>
                          {panel.data.map((item,i)=>(
                            <tr key={i} style={{ transition:'background var(--t-fast)' }}
                              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-elevated)'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <TD><span style={{ color:'var(--text-primary)', fontWeight:500 }}>{item.name||item.title}</span><br/><span style={{ fontSize:11, color:'var(--text-tertiary)' }}>{item.email||item.company}</span></TD>
                              <TD><span className={item.role?`badge badge-${item.role==='admin'?'red':item.role==='company'?'purple':'blue'}`:item.isActive?'badge badge-green':'badge badge-gray'}>{item.role||item.type}</span></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {tab==='users' && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr><TH>User</TH><TH>Role</TH><TH>Verified</TH><TH>Joined</TH><TH>Actions</TH></tr></thead>
                  <tbody>
                    {users.map(u=>(
                      <tr key={u._id} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-elevated)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <TD><span style={{ color:'var(--text-primary)', fontWeight:500 }}>{u.name}</span><br/><span style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'var(--font-mono)' }}>{u.email}</span></TD>
                        <TD>
                          <select value={u.role} onChange={e=>handleRoleChange(u._id,e.target.value)} disabled={u._id===user._id}
                            style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-default)', color:'var(--text-primary)', fontFamily:"'Geist'", fontSize:12, padding:'4px 8px', borderRadius:'var(--radius-sm)', outline:'none', opacity:u._id===user._id?.5:1 }}>
                            {['student','company','admin'].map(r=><option key={r} value={r}>{r}</option>)}
                          </select>
                        </TD>
                        <TD><span className={u.isEmailVerified?'badge badge-green':'badge badge-gray'}>{u.isEmailVerified?'Verified':'Unverified'}</span></TD>
                        <TD style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>{new Date(u.createdAt).toLocaleDateString()}</TD>
                        <TD>{u._id!==user._id&&<button onClick={()=>handleDeleteUser(u._id)} className="btn btn-danger btn-xs">Delete</button>}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Opportunities */}
          {tab==='opportunities' && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr><TH>Role</TH><TH>Type</TH><TH>Status</TH><TH>Posted</TH><TH>Actions</TH></tr></thead>
                  <tbody>
                    {opps.map(o=>(
                      <tr key={o._id} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-elevated)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <TD><span style={{ color:'var(--text-primary)', fontWeight:500 }}>{o.title}</span><br/><span style={{ fontSize:11, color:'var(--text-tertiary)' }}>{o.company}</span></TD>
                        <TD><span className={`type-${o.type}`}>{o.type}</span></TD>
                        <TD><span className={o.isActive?'badge badge-green':'badge badge-gray'}>{o.isActive?'Active':'Inactive'}</span></TD>
                        <TD style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>{new Date(o.createdAt).toLocaleDateString()}</TD>
                        <TD><div style={{ display:'flex', gap:6 }}><button onClick={()=>handleToggleOpp(o._id)} className="btn btn-secondary btn-xs">{o.isActive?'Deactivate':'Activate'}</button><button onClick={()=>handleDeleteOpp(o._id)} className="btn btn-danger btn-xs">Delete</button></div></TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Applications */}
          {tab==='applications' && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr><TH>Student</TH><TH>Role</TH><TH>Status</TH><TH>Applied</TH></tr></thead>
                  <tbody>
                    {apps.map(a=>(
                      <tr key={a._id} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-elevated)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <TD><span style={{ color:'var(--text-primary)', fontWeight:500 }}>{a.studentId?.name||'—'}</span><br/><span style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'var(--font-mono)' }}>{a.studentId?.email}</span></TD>
                        <TD><span style={{ color:'var(--text-secondary)' }}>{a.opportunityId?.title||'—'}</span><br/><span style={{ fontSize:11, color:'var(--text-tertiary)' }}>{a.opportunityId?.company}</span></TD>
                        <TD><span className={`status-${a.status}`}>{a.status}</span></TD>
                        <TD style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>{new Date(a.createdAt).toLocaleDateString()}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
