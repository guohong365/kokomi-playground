uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

varying float vOpacity;

void main(){
    float distanceToCenter=distance(gl_PointCoord,vec2(.5));
    float strength=.05/distanceToCenter-.1;
    
    vec3 col=vec3(1.);
    float alpha=clamp(vOpacity,.5,1.);
    
    csm_DiffuseColor=vec4(col,strength*alpha);
}