/* Decorative award animations; the award text and links work without JavaScript. */
(() => {
  if (!document.body.classList.contains('bento-home')) return;
  const options = { playing: true, aircraft: 0.45, speed: 1.5 };
  const palettes = {};
  const scenes = Array.from(document.querySelectorAll('[data-award-scene]'), canvas => {
    const card=canvas.parentElement, style=getComputedStyle(card), kind=canvas.dataset.awardScene;
    palettes[kind]=Object.fromEntries(['bg','text','accent','secondary','motion'].map(key=>[key,style.getPropertyValue('--award-'+key).trim()]));
    return { canvas, card, kind, g:canvas.getContext('2d'), w:0, h:0, visible:true };
  }).filter(s=>s.g);
  if(!scenes.length)return;
      function path(g, points, close = false) { g.beginPath(); points.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); if (close) g.closePath(); }
      function dot(g,x,y,r,color) { g.fillStyle = color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill(); }
      // Closed-loop roots of s(s+1)(s+3)+K = 0, using an analytic cubic solution.
      function locusRoots(k) {
        const p=-7/3,q=20/27+k,d=q*q/4+p*p*p/27;
        if(d>=0){
          const u=Math.cbrt(-q/2+Math.sqrt(d)),v=Math.cbrt(-q/2-Math.sqrt(d));
          return [[-(u+v)/2-4/3,Math.sqrt(3)*(u-v)/2],[-(u+v)/2-4/3,-Math.sqrt(3)*(u-v)/2],[u+v-4/3,0]];
        }
        const radius=2*Math.sqrt(-p/3),angle=Math.acos(Math.max(-1,Math.min(1,-q/(2*Math.sqrt(-(p*p*p)/27)))))/3;
        return [0,1,2].map(i=>[radius*Math.cos(angle-2*Math.PI*i/3)-4/3,0]).sort((a,b)=>b[0]-a[0]);
      }
      const locusBranches=[[],[],[]];
      for(let i=0;i<=600;i++){const k=30*Math.pow(i/600,2);locusRoots(k).forEach((p,j)=>locusBranches[j].push(p));}
      function aircraft(g,t,palette) {
        g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = 0.8;
        g.strokeStyle = palette.secondary;g.fillStyle = palette.motion;
        path(g,[[-4,27],[-9,31],[-33,38],[-34,43],[-5,40],[5,40],[34,43],[33,38],[9,31],[4,27]],true);g.fill();g.stroke();
        g.strokeStyle = palette.text;g.lineWidth=2.3;path(g,[[0,1],[0,38]]);g.stroke();
        g.lineWidth=.7;g.fillStyle=palette.motion;g.strokeStyle=palette.secondary;
        path(g,[[-5,-13],[-67,-6],[-73,0],[-71,8],[-7,5],[7,5],[71,8],[73,0],[67,-6],[5,-13]],true);g.fill();g.stroke();
        g.strokeStyle=palette.bg;
        for(let x=-62;x<=62;x+=9){ if(Math.abs(x)<10)continue; const q=Math.abs(x);path(g,[[x,-12+q*.09],[x,6+q*.02]]);g.stroke(); }
        g.strokeStyle=palette.secondary;path(g,[[-69,2],[-7,-1],[7,-1],[69,2]]);g.stroke();
        g.fillStyle=palette.accent;g.beginPath();g.moveTo(0,-40);g.bezierCurveTo(-6,-38,-8,-29,-7,-15);g.lineTo(-5,13);g.lineTo(0,27);g.lineTo(5,13);g.lineTo(7,-15);g.bezierCurveTo(8,-29,6,-38,0,-40);g.fill();g.stroke();
        g.fillStyle=palette.bg;g.beginPath();g.ellipse(0,-21,4,8,0,0,Math.PI*2);g.fill();
        g.strokeStyle=palette.secondary;g.lineWidth=.8;for(let y=-7;y<17;y+=6){path(g,[[-5,y],[5,y]]);g.stroke();}
        g.fillStyle=palette.secondary;path(g,[[0,27],[3,35],[0,45],[-2,38]],true);g.fill();
        g.save();g.translate(0,-42);g.scale(Math.cos(t*30)*.3+.7,1);g.fillStyle=palette.text;g.beginPath();g.ellipse(0,0,15,1,0,0,Math.PI*2);g.fill();g.restore();dot(g,0,-42,1.7,palette.secondary);
      }
      function draw(s,t) {
        const {g,w,h} = s,palette=palettes[s.kind];g.clearRect(0,0,w,h);
        if(s.kind === 'uav') {
          const a = t*.22-1.2, cx=w*.54, cy=h*.55, rx=w*.29, ry=h*.32;
          g.save();g.globalAlpha=.09;g.strokeStyle=palette.motion;g.lineWidth=.9;g.setLineDash([2,7]);g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.stroke();g.restore();
          const x=cx+rx*Math.cos(a),y=cy+ry*Math.sin(a);
          const heading=Math.atan2(ry*Math.cos(a),-rx*Math.sin(a))+Math.PI/2;
          g.save();g.globalAlpha=options.aircraft;g.translate(x,y);g.rotate(heading);g.scale(.85+.06*Math.sin(a),.85);aircraft(g,t,palette);g.restore();
        } else if(s.kind === 'honours') {
          const r=Math.min(w*.23,h*.31);
          g.save();g.translate(w*.76,h*.70);
          const foil=g.createLinearGradient(-r,-r,r,r);foil.addColorStop(0,palette.motion);foil.addColorStop(.45,palette.secondary);foil.addColorStop(.7,palette.motion);foil.addColorStop(1,palette.secondary);
          g.strokeStyle=foil;g.fillStyle=foil;g.globalAlpha=.38;g.lineWidth=.9;
          for(const scale of [.62,.70,1]){g.beginPath();g.arc(0,0,r*scale,0,Math.PI*2);g.stroke();}
          for(let i=0;i<56;i++){const a=i*Math.PI/28;dot(g,r*.91*Math.cos(a),r*.91*Math.sin(a),.55,palette.motion);}
          for(const sign of [-1,1]){
            g.beginPath();g.moveTo(sign*r*.1,r*.83);g.bezierCurveTo(sign*r*.91,r*.60,sign*r*.97,-r*.32,sign*r*.34,-r*.84);g.stroke();
            for(let k=0;k<9;k++){
              const a=-1.12+k*.27,x=sign*r*.78*Math.cos(a),y=r*.84*Math.sin(a);
              g.save();g.translate(x,y);g.rotate(sign*(a+.9));
              g.beginPath();g.moveTo(-r*.14,0);g.quadraticCurveTo(0,-r*.15,r*.16,0);g.quadraticCurveTo(0,r*.07,-r*.14,0);g.fill();
              g.strokeStyle='#ffffff';g.lineWidth=.45;path(g,[[-r*.1,0],[r*.12,0]]);g.stroke();g.restore();
            }
          }
          g.fillStyle=palette.secondary;g.font='400 '+Math.round(r*.67)+'px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('I',0,r*.015);
          g.globalAlpha=.24;g.strokeStyle=palette.accent;g.lineWidth=1.5;g.beginPath();g.arc(0,0,r*.98,t*.28,t*.28+.8);g.stroke();g.restore();
        } else if(s.kind === 'satellite') {
          const cx=w*.79,cy=h*.74;g.save();g.translate(cx,cy);g.strokeStyle=palette.motion;g.globalAlpha=.13;g.lineWidth=.65;
          for(const r of [28,53,78]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();}path(g,[[-90,0],[90,0]]);g.stroke();path(g,[[0,-80],[0,80]]);g.stroke();
          g.rotate(Math.sin(t*.18)*.16-.12);g.lineWidth=1;
          const project=(x,y,z)=>[x*.92-y*.48,x*.23+y*.42-z];
          const line=(points)=>{path(g,points.map(p=>project(...p)));g.stroke();};
          const face=(points,fill,alpha)=>{g.globalAlpha=alpha;g.fillStyle=fill;path(g,points.map(p=>project(...p)),true);g.fill();g.globalAlpha=.55;g.strokeStyle=palette.motion;g.stroke();};
          // Both wings use the same 3D plane and projection; the two hinges meet the body at mid-height.
          for(const sign of [-1,1]){
            g.globalAlpha=.55;line([[sign*10,0,0],[sign*17,0,0]]);
            face([[sign*17,-10,0],[sign*49,-10,0],[sign*49,10,0],[sign*17,10,0]],palette.motion,.20);
            g.globalAlpha=.45;for(let i=1;i<4;i++)line([[sign*(17+i*8),-10,0],[sign*(17+i*8),10,0]]);
            line([[sign*17,0,0],[sign*49,0,0]]);
          }
          face([[-10,-9,13],[10,-9,13],[10,9,13],[-10,9,13]],palette.secondary,.30);
          face([[-10,9,13],[10,9,13],[10,9,-13],[-10,9,-13]],palette.motion,.17);
          face([[10,-9,13],[10,9,13],[10,9,-13],[10,-9,-13]],palette.secondary,.22);
          g.globalAlpha=.45;line([[0,0,13],[0,0,23]]);dot(g,...project(0,0,23),1.4,palette.accent);g.restore();
          const a=t*.4;dot(g,cx+65*Math.cos(a),cy+65*Math.sin(a),2,palette.accent);
        } else if(s.kind === 'nasa') {
          g.save();for(let k=0;k<22;k++){const x=((k*71+19)%223)/223*w,y=((k*43+9)%157)/157*h;g.globalAlpha=.15+.25*(.5+.5*Math.sin(t*.6+k));dot(g,x,y,k%4===0?1.1:.65,palette.motion);}g.restore();
          g.save();g.translate(w*.95,h*1.25);const r=h*.66;const glow=g.createRadialGradient(0,0,r*.87,0,0,r*1.25);glow.addColorStop(0,palette.motion+'00');glow.addColorStop(.5,palette.motion+'38');glow.addColorStop(.7,palette.motion+'00');g.fillStyle=glow;g.beginPath();g.arc(0,0,r*1.3,0,Math.PI*2);g.fill();g.strokeStyle=palette.motion;g.globalAlpha=.35;g.lineWidth=1;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();g.restore();
          g.save();g.translate(w*.72,h*.77);g.rotate(-.55);g.strokeStyle=palette.accent;g.globalAlpha=.65;g.lineWidth=1.4;g.beginPath();g.ellipse(0,0,w*.55,h*.18,0,0,Math.PI*2);g.stroke();const a=t*.28;dot(g,w*.55*Math.cos(a),h*.18*Math.sin(a),2.2,palette.secondary);g.restore();
        } else if(s.kind === 'royal') {
          const scale=Math.min(w/8.4,h/7.4),ox=w-2.2*scale-10,oy=h*.5;
          const mx=x=>ox+x*scale,my=y=>oy-y*scale;
          const k=15*(1-Math.cos(2*Math.PI*t/18));
          const roots=locusRoots(k);
          g.save();g.globalAlpha=.10;g.fillStyle=palette.motion;g.fillRect(mx(0),0,w-mx(0),h);g.restore();
          g.save();g.strokeStyle=palette.motion;g.globalAlpha=.20;g.lineWidth=.8;path(g,[[0,my(0)],[w,my(0)]]);g.stroke();path(g,[[mx(0),0],[mx(0),h]]);g.stroke();g.restore();
          g.save();g.strokeStyle=palette.motion;g.globalAlpha=.55;g.lineWidth=1.3;
          locusBranches.forEach(branch=>{path(g,branch.map(p=>[mx(p[0]),my(p[1])]));g.stroke();});g.restore();
          g.save();g.strokeStyle=palette.text;g.globalAlpha=.40;g.lineWidth=1;
          [0,-1,-3].forEach(p=>{const x=mx(p),y=my(0);path(g,[[x-3,y-3],[x+3,y+3]]);g.stroke();path(g,[[x-3,y+3],[x+3,y-3]]);g.stroke();});g.restore();
          roots.forEach(p=>{dot(g,mx(p[0]),my(p[1]),6,palette.bg);dot(g,mx(p[0]),my(p[1]),3.5,palette.motion);});
          g.save();g.font='10px Arial,sans-serif';g.fillStyle=palette.motion;g.globalAlpha=.65;g.textAlign='right';g.fillText('K = '+k.toFixed(1)+' · '+(k<12?'stable':'unstable'),w-12,h-12);g.restore();
        }
      }

  let last=0,elapsed=0;
  function size(scene){
    const box=scene.card.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    scene.w=box.width;scene.h=box.height;
    scene.canvas.width=Math.round(box.width*dpr);scene.canvas.height=Math.round(box.height*dpr);
    scene.g.setTransform(dpr,0,0,dpr,0,0);
    if(scene.w&&scene.h)draw(scene,elapsed);
  }
  const resize=new ResizeObserver(entries=>entries.forEach(entry=>{const scene=scenes.find(s=>s.card===entry.target);if(scene)size(scene);}));
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{const scene=scenes.find(s=>s.card===entry.target);if(scene)scene.visible=entry.isIntersecting;}));
  scenes.forEach(scene=>{size(scene);resize.observe(scene.card);observer.observe(scene.card);});
  const button=document.querySelector('[data-awards-motion]');
  if(button){button.hidden=false;button.addEventListener('click',()=>{options.playing=!options.playing;button.textContent=options.playing?'Pause award animations':'Play award animations';button.setAttribute('aria-pressed',String(!options.playing));last=0;});}
  document.addEventListener('visibilitychange',()=>{last=0;});
  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden||!options.playing){last=0;return;}
    if(now-last<32)return;
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;elapsed+=dt*options.speed;
    scenes.forEach(scene=>{if(scene.visible&&scene.w&&scene.h)draw(scene,elapsed);});
  }
  requestAnimationFrame(frame);
})();
