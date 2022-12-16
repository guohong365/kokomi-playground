uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform sampler2D uTexture;

float circle(vec2 st,float r,vec2 v){
    float d=length(st-v);
    float c=smoothstep(r,r+.001,d);
    return c;
}

void main(){
    vec2 p=vUv;
    
    vec4 col=texture(uTexture,p);
    // vec4 col=vec4(p,0.,1.);
    
    float alpha=1.-circle(p,.5,vec2(.5));
    
    gl_FragColor=vec4(col.xyz,alpha);
}