uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform float uVelocity;

const float PI=3.14159265359;

vec3 distort(vec3 p){
    p.x+=sin(uv.y*PI)*uVelocity*.125;
    return p;
}

void main(){
    vec3 p=position;
    vec3 dp=distort(p);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(dp,1.);
    
    vUv=uv;
}