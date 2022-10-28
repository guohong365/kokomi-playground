const prepare = async () => {
  const vertText2 = await fetchText(`./vert2.glsl?v=${Math.random()}`);
  const vertexShader2 = vertText2;
  window.vertexShader2 = vertexShader2;
  const fragText2 = await fetchText(`./frag2.glsl?v=${Math.random()}`);
  const fragmentShader2 = fragText2;
  window.fragmentShader2 = fragmentShader2;

  const vertText3 = await fetchText(`./vert3.glsl?v=${Math.random()}`);
  const vertexShader3 = vertText3;
  window.vertexShader3 = vertexShader3;
  const fragText3 = await fetchText(`./frag3.glsl?v=${Math.random()}`);
  const fragmentShader3 = fragText3;
  window.fragmentShader3 = fragmentShader3;

  const vertText4 = await fetchText(`./vert4.glsl?v=${Math.random()}`);
  const vertexShader4 = vertText4;
  window.vertexShader4 = vertexShader4;
  const fragText4 = await fetchText(`./frag4.glsl?v=${Math.random()}`);
  const fragmentShader4 = fragText4;
  window.fragmentShader4 = fragmentShader4;

  const vertText5 = await fetchText(`./vert5.glsl?v=${Math.random()}`);
  const vertexShader5 = vertText5;
  window.vertexShader5 = vertexShader5;
  const fragText5 = await fetchText(`./frag5.glsl?v=${Math.random()}`);
  const fragmentShader5 = fragText5;
  window.fragmentShader5 = fragmentShader5;
};
