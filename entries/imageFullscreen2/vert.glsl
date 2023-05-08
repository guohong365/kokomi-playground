uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec2 uMeshSize;
uniform vec2 uMeshPosition;
uniform float uProgress;

const float PI=3.14159265359;

// progress
// plain
float getProgress1(float pr,vec2 uv){
    return pr;
}

// stagger
float getProgress2(float pr,vec2 uv){
    float activation=uv.x;
    float latestStart=.5;
    float startAt=activation*latestStart;
    pr=smoothstep(startAt,1.,pr);
    return pr;
}

// transform
// wave
vec3 wave(vec3 p,vec2 uv,vec2 scaleRatio,float pr){
    float angle=pr*PI/2.;
    float wave=cos(angle);
    float c=sin(length(uv-.5)*15.+pr*12.)*.5+.5;
    
    p.x*=mix(1.,scaleRatio.x+wave*c,pr);
    p.y*=mix(1.,scaleRatio.y+wave*c,pr);
    return p;
}

vec3 fullscreen(vec3 p){
    // copy uv
    vec2 newUv=uv;
    
    // get progress
    float pr=getProgress1(uProgress,uv);
    
    // scale to view size
    vec2 scaleRatio=vec2(iResolution/uMeshSize);
    p=wave(p,newUv,scaleRatio,pr);
    
    // get uv
    vUv=newUv;
    
    // move to center
    p.x+=-uMeshPosition.x*pr;
    p.y+=-uMeshPosition.y*pr;
    
    // z
    p.z+=pr;
    
    return p;
}

void main(){
    vec3 p=position;
    
    p=fullscreen(p);
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}