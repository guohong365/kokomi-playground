uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec3 uColor;
varying float vOpacity;

float circle(float d,float size,float blur){
    float c=smoothstep(size,size*(1.-blur),d);
    float ring=smoothstep(size*.8,size,d);
    c*=mix(.7,1.,ring);
    return c;
}

void main(){
    float distanceToCenter=distance(gl_PointCoord,vec2(.5));
    float strength=circle(distanceToCenter,.5,.4);
    
    vec3 col=uColor;
    // float alpha=clamp(vOpacity,.5,1.);
    
    csm_DiffuseColor=vec4(col,strength);
}