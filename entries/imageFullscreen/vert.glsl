uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec2 uMeshSize;
uniform vec2 uMeshPosition;
uniform float uProgress;

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
// flip
vec3 flipX(vec3 p,float pr){
    p.x=mix(p.x,-p.x,pr);
    return p;
}

vec2 flipUvX(vec2 uv,float pr){
    uv.x=mix(uv.x,1.-uv.x,pr);
    return uv;
}

vec3 fullscreen(vec3 p){
    // copy uv
    vec2 newUv=uv;
    
    // get progress
    float pr=getProgress2(uProgress,uv);
    
    // scale to view size
    vec2 scale=mix(vec2(1.),iResolution/uMeshSize,pr);
    p.xy*=scale;
    
    // other transforms
    p=flipX(p,pr);
    
    float latestStart=.5;
    float stepVal=latestStart-pow(latestStart,3.);
    newUv=flipUvX(newUv,step(stepVal,pr));
    
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