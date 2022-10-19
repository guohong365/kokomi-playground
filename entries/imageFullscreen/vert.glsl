uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec2 uMeshSize;
uniform vec2 uMeshPosition;
uniform float uProgress;

vec3 fullscreen(vec3 p){
    // Scale to view size
    vec2 scale=mix(vec2(1.),iResolution/uMeshSize,uProgress);
    p.xy*=scale;
    
    // Move towards center
    p.x+=-uMeshPosition.x*uProgress;
    p.y+=-uMeshPosition.y*uProgress;
    
    // z
    p.z+=uProgress;
    
    return p;
}

void main(){
    vec3 p=position;
    
    p=fullscreen(p);
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    
    vUv=uv;
}