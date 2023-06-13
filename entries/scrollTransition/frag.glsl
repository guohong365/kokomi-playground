uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

uniform float uProgress;

vec4 getFromColor(vec2 uv){
    return texture(iChannel0,uv);
}

vec4 getToColor(vec2 uv){
    return texture(iChannel1,uv);
}

vec4 transition(vec2 uv){
    // float progress=iMouse.x/iResolution.x;
    float progress=uProgress;
    
    float ratio=iResolution.x/iResolution.y;
    
    // basic
    // float pr=step(uv.y,progress);
    
    // return mix(
        //     getFromColor(uv),
        //     getToColor(uv),
        //     pr
    // );
    
    // directional warp
    // credit:https://gl-transitions.com/editor/directionalwarp
    vec2 direction=vec2(-1.,1.);
    
    const float smoothness=.5;
    const vec2 center=vec2(.5,.5);
    
    vec2 v=normalize(direction);
    v/=abs(v.x)+abs(v.y);
    float d=v.x*center.x+v.y*center.y;
    float m=1.-smoothstep(-smoothness,0.,v.x*uv.x+v.y*uv.y-(d-.5+progress*(1.+smoothness)));
    return mix(getFromColor((uv-.5)*(1.-m)+.5),getToColor((uv-.5)*m+.5),m);
}

void main(){
    vec2 p=vUv;
    
    vec4 col=transition(p);
    
    gl_FragColor=col;
}