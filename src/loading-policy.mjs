// Explicit scheduling preference, not clinical approval or a change to recorded exposure.
export function validLoadingPolicy(policy){
 return !!policy&&typeof policy==='object'&&!Array.isArray(policy)&&policy.version===1&&['strict','advisory'].includes(policy.mode)&&Number.isFinite(policy.selectedAt)&&policy.selectedAt>=0;
}
export function jointTimeMode(settings={}){
 return validLoadingPolicy(settings.loadingPolicy)&&settings.loadingPolicy.mode==='advisory'?'advisory':'strict';
}
