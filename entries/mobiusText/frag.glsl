uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec3 uColor;

varying float vXDebug;

void main(){
    vec2 p=vUv;
    
    // vec3 col=vec3(p,0.);
    vec3 col=uColor;
    
    csm_DiffuseColor=vec4(col,1.);
    
    // csm_DiffuseColor=vec4(vec3(vXDebug,0.,0.),1.);
}