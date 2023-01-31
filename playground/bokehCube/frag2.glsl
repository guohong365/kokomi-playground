uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform vec3 uColors[COLOR_COUNT];
varying float vOpacity;
varying float vPointId;
varying float vColorId;

float circle(float d,float size,float blur){
    float c=smoothstep(size,size*(1.-blur),d);
    float ring=smoothstep(size*.8,size,d);
    c*=mix(.7,1.,ring);
    return c;
}

float random(float n){
    return fract(sin(n)*43758.5453123);
}

void main(){
    float distanceToCenter=distance(gl_PointCoord,vec2(.5));
    float strength=circle(distanceToCenter,.5,.4);
    
    vec3 col=uColors[0];
    if(vColorId<.5){
        col=uColors[0];
    }else{
        col=uColors[1];
    }
    
    // float alpha=clamp(vOpacity,.5,1.);
    
    csm_DiffuseColor=vec4(col,strength);
}