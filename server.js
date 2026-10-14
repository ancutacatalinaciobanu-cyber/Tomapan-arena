const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const crypto=require('crypto');
const QRCode=require('qrcode');
const app=express();const server=http.createServer(app);const io=new Server(server);
app.use(express.static(require('path').join(__dirname,'public')));
app.get('/healthz',(_,res)=>res.json({ok:true}));
app.get('/qr/:code',async(req,res)=>{const r=getRoom(req.params.code);if(!r)return res.sendStatus(404);try{const origin=process.env.PUBLIC_URL||`${req.protocol}://${req.get('host')}`;const png=await QRCode.toBuffer(origin+'/?room='+r.code,{width:300,margin:2});res.type('png').send(png)}catch{res.sendStatus(500)}});
app.set('trust proxy',1);
const rooms=new Map();const CATS=['Țară','Oraș','Munte','Apă','Plantă','Animal','Nume'];
const LETTERS='ABCDEFGHILMNOPRSTUV';
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
function code(){let c;do{c=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(c));return c}
function emit(r){io.to(r.code).emit('state',publicState(r))}
function publicState(r){return {serverNow:Date.now(),code:r.code,phase:r.phase,round:r.round,letter:r.letter,deadline:r.deadline,duration:r.duration,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,submitted:!!p.submitted})),results:r.phase==='review'||r.phase==='scores'?r.results:null,roundScores:r.phase==='scores'?r.roundScores:null,history:r.history}}
function teacherState(r,s){s.emit('teacherToken',r.teacherToken);s.emit('privateState',{answers:Object.fromEntries([...r.players].map(([id,p])=>[id,p.answers||[]]))})}
function finish(r){if(r.phase!=='playing')return;r.phase='review';r.deadline=null;const counts=CATS.map((_,i)=>{let m={};for(const p of r.players.values()){let a=norm((p.answers||[])[i]);if(a)m[a]=(m[a]||0)+1}return m});r.results={};for(const p of r.players.values()){r.results[p.id]=CATS.map((_,i)=>{const answer=(p.answers||[])[i]||'';return {answer,valid:!!answer.trim()&&norm(answer)[0]===norm(r.letter),duplicate:(counts[i][norm(answer)]||0)>1}})}emit(r);io.to(r.code).emit('reviewNeeded');}
function getRoom(c){return rooms.get(String(c||'').trim().toUpperCase())}
function authTeacher(s,r,token){return r&&token===r.teacherToken}
function attach(s,c){for(const old of s.rooms)if(old!==s.id)s.leave(old);s.data={};s.join(c)}
io.on('connection',s=>{
 s.use(([event,payload],next)=>{if(payload===null||typeof payload!=='object'||Array.isArray(payload))return next(new Error('Format invalid'));next()});
 s.on('createRoom',(data,cb)=>{const c=code();const r={code:c,teacherToken:crypto.randomBytes(24).toString('hex'),phase:'lobby',round:0,letter:'',duration:90,deadline:null,players:new Map(),results:null,roundScores:null,history:[],timer:null};rooms.set(c,r);attach(s,c);s.data.teacher=c;teacherState(r,s);cb?.({ok:true,code:c,token:r.teacherToken});emit(r)});
 s.on('joinTeacher',({code,token}={},cb)=>{const r=getRoom(code);if(!authTeacher(s,r,token))return cb?.({error:'Cod sau cheie profesor incorectă'});attach(s,r.code);s.data.teacher=r.code;teacherState(r,s);emit(r);cb?.({ok:true})});
 s.on('joinStudent',({code,name,playerId}={},cb)=>{const r=getRoom(code);name=String(name||'').trim().slice(0,35);if(!r||!name)return cb?.({error:'Cod sau nume invalid'});let p=playerId&&r.players.get(playerId);if(!p){if(r.phase!=='lobby')return cb?.({error:'Sesiunea a început. Intră înainte de prima rundă'});if(r.players.size>=35)return cb?.({error:'Sesiunea are deja 35 de elevi'});if([...r.players.values()].some(x=>norm(x.name)===norm(name)))return cb?.({error:'Numele este deja folosit'});playerId=crypto.randomBytes(16).toString('hex');p={id:playerId,name,score:0,answers:[],submitted:false};r.players.set(playerId,p)}attach(s,r.code);s.data.player={code:r.code,id:playerId};cb?.({ok:true,playerId,code:r.code});emit(r)});
 s.on('startRound',({code,token,letter,duration}={},cb)=>{const r=getRoom(code);if(!authTeacher(s,r,token))return cb?.({error:'Acces interzis'});if(r.phase==='playing'||r.phase==='review')return cb?.({error:'Încheie runda curentă'});if(r.round>=7)return cb?.({error:'Cele 7 runde s-au încheiat'});let l=String(letter||'').toUpperCase();if(l.length!==1||!LETTERS.includes(l))l=LETTERS[Math.floor(Math.random()*LETTERS.length)];r.round++;r.letter=l;r.duration=Math.min(300,Math.max(30,Number(duration)||90));r.phase='playing';r.results=null;r.roundScores=null;r.deadline=Date.now()+r.duration*1000;for(const p of r.players.values()){p.answers=[];p.submitted=false}clearTimeout(r.timer);r.timer=setTimeout(()=>finish(r),r.duration*1000);emit(r);cb?.({ok:true})});
 s.on('submit',({answers}={},cb)=>{const {code,id}=s.data.player||{};const r=getRoom(code),p=r?.players.get(id);if(!r||!p||r.phase!=='playing'||Date.now()>r.deadline)return cb?.({error:'Runda nu mai este activă'});if(p.submitted)return cb?.({error:'Răspunsurile au fost deja trimise'});if(!Array.isArray(answers)||answers.length!==7)return cb?.({error:'Format invalid'});p.answers=answers.map(x=>String(x||'').trim().slice(0,75));p.submitted=true;cb?.({ok:true});emit(r)});
 s.on('finishRound',({code,token}={},cb)=>{const r=getRoom(code);if(!authTeacher(s,r,token))return cb?.({error:'Acces interzis'});clearTimeout(r.timer);finish(r);cb?.({ok:true})});
 s.on('setValid',({code,token,id,index,valid}={},cb)=>{const r=getRoom(code);if(!authTeacher(s,r,token)||r.phase!=='review'||!r.results?.[id]?.[index])return cb?.({error:'Nu se poate modifica'});r.results[id][index].valid=!!valid;emit(r);cb?.({ok:true})});
 s.on('scoreRound',({code,token}={},cb)=>{const r=getRoom(code);if(!authTeacher(s,r,token)||r.phase!=='review')return cb?.({error:'Nu se poate puncta'});r.roundScores={};for(const p of r.players.values()){const points=(r.results[p.id]||[]).reduce((sum,a)=>sum+(a.valid?(a.duplicate?5:10):0),0);p.score+=points;r.roundScores[p.id]=points}r.history.push({round:r.round,letter:r.letter,points:r.roundScores});r.phase='scores';emit(r);cb?.({ok:true})});
 s.on('leaveRoom',({code,token,id}={},cb)=>{const r=getRoom(code);if(!authTeacher(s,r,token)||r.phase!=='lobby')return cb?.({error:'Poți elimina elevi doar înainte de prima rundă'});r.players.delete(id);emit(r);cb?.({ok:true})});
});
server.listen(process.env.PORT||3000,()=>console.log('ȚOMAPAN Arena online'));
