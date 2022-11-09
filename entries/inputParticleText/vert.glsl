uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform float uPointSize;

varying float vOpacity;
varying float vColorId;
varying vec3 vPosition;
varying float vTransparent;

attribute float pIndex;

uniform float uDepth;
uniform float uTransparentRate;

float random(float n){
    return fract(sin(n)*43758.5453123);
}

highp float random(vec2 co)
{
    highp float a=12.9898;
    highp float b=78.233;
    highp float c=43758.5453;
    highp float dt=dot(co.xy,vec2(a,b));
    highp float sn=mod(dt,3.14);
    return fract(sin(sn)*c);
}

float randFloat(vec2 co,float minVal,float maxVal)
{
    return random(co)*(maxVal-minVal)+minVal;
}

//
// GLSL textureless classic 2D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-08-22
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/ashima/webgl-noise
//

vec4 mod289(vec4 x)
{
    return x-floor(x*(1./289.))*289.;
}

vec4 permute(vec4 x)
{
    return mod289(((x*34.)+1.)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159-.85373472095314*r;
}

vec2 fade(vec2 t){
    return t*t*t*(t*(t*6.-15.)+10.);
}

// Classic Perlin noise
float cnoise(vec2 P)
{
    vec4 Pi=floor(P.xyxy)+vec4(0.,0.,1.,1.);
    vec4 Pf=fract(P.xyxy)-vec4(0.,0.,1.,1.);
    Pi=mod289(Pi);// To avoid truncation effects in permutation
    vec4 ix=Pi.xzxz;
    vec4 iy=Pi.yyww;
    vec4 fx=Pf.xzxz;
    vec4 fy=Pf.yyww;
    
    vec4 i=permute(permute(ix)+iy);
    
    vec4 gx=fract(i*(1./41.))*2.-1.;
    vec4 gy=abs(gx)-.5;
    vec4 tx=floor(gx+.5);
    gx=gx-tx;
    
    vec2 g00=vec2(gx.x,gy.x);
    vec2 g10=vec2(gx.y,gy.y);
    vec2 g01=vec2(gx.z,gy.z);
    vec2 g11=vec2(gx.w,gy.w);
    
    vec4 norm=taylorInvSqrt(vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11)));
    g00*=norm.x;
    g01*=norm.y;
    g10*=norm.z;
    g11*=norm.w;
    
    float n00=dot(g00,vec2(fx.x,fy.x));
    float n10=dot(g10,vec2(fx.y,fy.y));
    float n01=dot(g01,vec2(fx.z,fy.z));
    float n11=dot(g11,vec2(fx.w,fy.w));
    
    vec2 fade_xy=fade(Pf.xy);
    vec2 n_x=mix(vec2(n00,n01),vec2(n10,n11),fade_xy.x);
    float n_xy=mix(n_x.x,n_x.y,fade_xy.y);
    return 2.3*n_xy;
}

vec3 distort(vec3 p){
    float t=iTime*.25;
    float rndz=(random(pIndex)+cnoise(vec2(pIndex*.1,t*.5)));
    p.y+=fract((t+rndz)*.5)*uDepth;
    return p;
}

void main(){
    vec3 p=position;
    p=distort(p);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    
    vUv=uv;
    
    gl_PointSize=uPointSize;
    
    vec2 newUv=p.xy;
    vOpacity=random(pIndex);
    vColorId=random(pIndex);
    vPosition=p;
    vTransparent=random(pIndex);
}