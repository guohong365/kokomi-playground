uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec2 uHoverUv;
uniform float uHoverState;

vec3 distort(vec3 p){
    float dist=distance(uv,uHoverUv);
    float amp=40.;
    float speed=.7;
    float wave=amp*sin(speed*(p.x+p.y+iTime))*uHoverState;
    float radius=.35;
    float inCircle=1.-(clamp(dist,0.,radius)/radius);
    float distort=wave*inCircle;
    p.z+=distort;
    return p;
}

void main(){
    vec3 p=position;
    
    vec3 dp=distort(p);
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(dp,1.);
    
    vUv=uv;
}