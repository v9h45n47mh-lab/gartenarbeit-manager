const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const frontend=path.resolve(__dirname,'../custom_components/gartenarbeit_manager/frontend');

// Load the actual ES modules and their relative imports; no replacement UI helpers.
async function loadCard(window,{localHttp=false}={}) {
  const context=vm.createContext({window,document:window.document,HTMLElement:window.HTMLElement,
    customElements:window.customElements,Intl,Date,JSON,Number,String,Set,setInterval,clearInterval,
    crypto:localHttp?{getRandomValues:bytes=>webcrypto.getRandomValues(bytes)}:webcrypto,
    URL,Image:window.Image});
  const cache=new Map();
  function module(file) {
    if(!file.startsWith(frontend+path.sep))throw new Error('Unexpected module outside frontend');
    if(!cache.has(file))cache.set(file,new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file}));
    return cache.get(file);
  }
  const main=module(path.join(frontend,'card.js'));
  await main.link((specifier,parent)=>{
    if(!specifier.startsWith('./'))throw new Error('Frontend imports must be local and pinned');
    return module(path.resolve(path.dirname(parent.identifier),specifier));
  });
  await main.evaluate();
  return window.customElements.get('gartenarbeit-manager-card');
}
module.exports={loadCard};
