uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec2 uMeshSize;
uniform vec2 uMeshPosition;
uniform float uProgress;

vec3 distort(vec3 p){
    // Scale to view size
    vec2 scaleToViewSize=iResolution/uMeshSize-1.;
    vec2 scale=vec2(1.+scaleToViewSize*uProgress);
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
    
    p=distort(p);
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    
    vUv=uv;
}