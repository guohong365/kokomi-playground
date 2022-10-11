uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;

varying vec2 vUv;

uniform sampler2D uDisp;
uniform float uProgress;
uniform float uIntensity;

void main(){
    vec2 p=vUv;
    
    vec2 dispVec=texture(uDisp,p).xy;
    
    vec2 dp1=vec2(p.x+dispVec.x*uProgress*uIntensity,p.y);
    vec2 dp2=vec2(p.x-dispVec.x*(1.-uProgress)*uIntensity,p.y);
    
    vec4 tex1=texture(uTexture1,dp1);
    vec4 tex2=texture(uTexture2,dp2);
    
    vec4 col=mix(tex1,tex2,uProgress);
    
    gl_FragColor=col;
}