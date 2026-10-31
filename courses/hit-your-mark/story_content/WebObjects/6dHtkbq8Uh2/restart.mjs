// UI confirmation gate only. Asking/cancelling never touches lesson data.
export function createRestartGate(){
  let pending=false;
  return {
    get pending(){return pending;},
    request(){pending=true;},
    cancel(){pending=false;},
    confirm(onConfirmed){
      if(!pending)return false;
      pending=false;
      onConfirmed();
      return true;
    }
  };
}
