const fs=require('fs'),path=require('path');
const bad=[];
function walk(d){try{fs.readdirSync(d,{withFileTypes:1}).forEach(f=>{const p=path.join(d,f.name);if(f.isDirectory()&&!['node_modules','.git','dist'].includes(f.name))walk(p);else if(f.isFile()&&/\.jsx$/.test(f.name)){const c=fs.readFileSync(p,'utf8'),ls=c.split(/\r?\n/);const exps=[];ls.forEach((l,i)=>{if(/^\s*export\s+default\s+/.test(l))exps.push(i+1)});if(exps.length>1)bad.push(p+' DUPE_EXPORT lines:'+exps.join(','));const last=ls.length;for(let i=last-1;i>=0;i--){const t=ls[i].trim();if(t==='}'){const after=ls.slice(i+1).filter(x=>x.trim()).length;if(after>1){bad.push(p+' TRAILING_CODE after_line:'+(i+1)+' trailing:'+after+'lines');for(let k=i+1;k<ls.length&&k<i+4;k++)if(ls[k].trim())bad.push('  L'+(k+1)+': '+ls[k].trim().substring(0,70))}break}}}})}catch(e){}}
walk('d:\\hello-roomhy\\Roomhy-Frontend\\src');
bad.forEach(b=>console.log(b));
if(!bad.length)console.log('ALL CLEAN');
