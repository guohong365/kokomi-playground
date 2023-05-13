uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D uTexture;

varying vec2 vUv;

uniform vec2 uMeshSize;
uniform vec2 uMeshPosition;

uniform float uProgress;
uniform float uHover;

void main(){
    vec2 uv=gl_FragCoord.xy/iResolution.xy;
    float aspect=iResolution.x/iResolution.y;
    vec2 s=vec2(1.);
    if(aspect<1.){
        s=vec2(1.,1./aspect);
    }else{
        s=vec2(aspect,1.);
    }
    uv=(uv-vec2(.5))*s/1.2+vec2(.5);
    uv.y-=.3;
    uv.x+=uMeshPosition.x/iResolution.x;
    
    uv.x+=uProgress;
    
    float scale=mix(1.2,1.4,uHover);
    uv=2.*uv-1.;
    uv/=scale;
    uv=(uv+1.)*.5;
    
    vec4 tex=texture(uTexture,uv);
    
    float alpha=mix(.6,1.,uHover);
    tex.a*=alpha;
    
    gl_FragColor=tex;
}