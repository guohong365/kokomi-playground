uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

varying vec3 vPosition;
varying vec3 vDirection;

void main(){
    vec3 p=position;
    
    csm_Position=p;
    
    vUv=uv;
    
    vPosition=p;
    vDirection=p-cameraPosition;
}