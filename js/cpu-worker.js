import { chooseCpuMove } from "./cpu.js";

self.addEventListener("message", event => {
  const {requestId,state,difficulty,overrides}=event.data;
  try { self.postMessage({requestId,ok:true,result:chooseCpuMove(state,difficulty,overrides)}); }
  catch (error) { self.postMessage({requestId,ok:false,error:error instanceof Error?error.message:String(error)}); }
});
