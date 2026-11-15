// 构建脚本：把 src/parts/*.js 拼接为一个 ES 模块，用 esbuild 打包（含 three.js），再内联进 template.html → ../index.html
// 模型（assets/models/*.glb）以二进制形式内嵌，index.html 依然可离线双击运行
const fs=require('fs'),path=require('path'),esbuild=require('esbuild');
const dir=path.join(__dirname,'parts');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort();
const entry=files.map(f=>`// ---- ${f}\n`+fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const res=esbuild.buildSync({stdin:{contents:entry,resolveDir:__dirname,sourcefile:'game.js'},bundle:true,format:'esm',loader:{'.glb':'binary'},minify:true,target:['chrome100','safari15'],write:false,legalComments:'inline'});
const js=res.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const tpl=fs.readFileSync(path.join(__dirname,'template.html'),'utf8');
const out=tpl.replace('<script>/*GAME*/</script>',()=>'<script type="module">\n'+js+'\n</script>');
fs.writeFileSync(path.join(__dirname,'..','index.html'),out);
console.log('built index.html',(out.length/1024).toFixed(0)+' KB from',files.join(', '));
