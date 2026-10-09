(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(e=>io.observe(e));
  const storyLog=document.getElementById('storymessages');
  const opening='Hi, welcome to GrowNomy. What would you like to improve?';
  const conversation=[
    ['user','I need a new website for my business in Norway.'],
    ['assistant','We can build your website and add an AI assistant to answer questions and collect enquiries.'],
    ['user','Can you also add the assistant to a website I already have?'],
    ['assistant',"Yes. We can integrate it with your existing site and connect enquiries to your team's tools."],
    ['user',"I'd like to discuss the website + AI assistant package."],
    ['assistant',"Let's plan the website, assistant and follow-up around your business."]
  ];
  let storyStarted=false,storyVisible=false,storyEpoch=0;
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function keepLatest(){storyLog.scrollTop=storyLog.scrollHeight}
  window.setCinematicChatVisible=visible=>{storyVisible=visible;if(!visible)window.setTypingAudio?.(false)};
  async function waitForVisible(epoch){
    while(!storyVisible||document.hidden){if(epoch!==storyEpoch)throw Error('Story reset');await delay(150)}
    if(epoch!==storyEpoch)throw Error('Story reset');
  }
  window.resetCinematicChat=()=>{
    storyEpoch++;storyStarted=false;window.setTypingAudio?.(false);
    storyLog.replaceChildren();const el=document.createElement('div');el.className='bubble';el.textContent=opening;storyLog.append(el);
    document.querySelector('.story-outcome').textContent='';
  };
  window.startCinematicChat=async()=>{
    if(storyStarted)return;storyStarted=true;const epoch=storyEpoch;
    storyLog.querySelector('.screen-services')?.remove();
    try{
    for(const [role,text] of conversation){
      await waitForVisible(epoch);
      const el=document.createElement('div');el.className='bubble live-typing'+(role==='user'?' user':'');el.textContent=role==='user'?'Typing…':'GrowNomy is typing…';storyLog.append(el);keepLatest();
      await delay(reduced?0:500);await waitForVisible(epoch);el.classList.remove('live-typing');el.textContent='';
      if(reduced){el.textContent=text;keepLatest()}
      else for(let i=0;i<text.length;i+=2){await waitForVisible(epoch);window.setTypingAudio?.(true);el.textContent=text.slice(0,i+2);keepLatest();await delay(32)}
      window.setTypingAudio?.(false);await delay(reduced?0:700);
    }
    document.querySelector('.story-outcome').textContent='Website + AI assistant · Norway · Project consultation';
    }catch(error){if(epoch===storyEpoch)throw error}
  };
  const log=document.getElementById('demoMessages'),input=document.getElementById('demoInput'),out=document.getElementById('demoLead');
  let stage=0,record={};
  const welcome='Hi, welcome to GrowNomy. Are you looking for a website, an AI assistant, or a complete system?';
  function bubble(text,user=false){const el=document.createElement('div');el.className='bubble'+(user?' user':'');el.textContent=text;log.append(el);log.scrollTop=log.scrollHeight}
  function chat(text){
    text=text.trim();if(!text)return;bubble(text,true);
    if(stage===0){
      record.service=text;
      if(/chat|assistant/i.test(text))bubble('We can add an AI assistant to your existing website to answer approved business questions and collect enquiries. What does your business do?');
      else if(/complete|system/i.test(text))bubble('Our complete system brings together a website, AI assistant and connected enquiry workflow. What does your business do?');
      else bubble('We create business websites around your services and the next step you want visitors to take. What does your business do?');
      stage=1;
    }else if(stage===1){record.business=text;bubble('What is your main goal: a better website, more enquiries, answering common questions, or less manual follow-up?');stage=2}
    else if(stage===2){record.goal=text;bubble('Which market does your business serve? For example, Norway.');stage=3}
    else if(stage===3){record.market=text;bubble('For this demo, add a fictional name and email address for the project discussion.');stage=4}
    else if(stage===4){record.contact=text;bubble('Your example project brief is ready. A real GrowNomy consultation would confirm the scope, integrations and price before work begins.');stage=5;out.textContent='SAMPLE PROJECT — '+[record.service,record.business,record.goal,record.market,record.contact].join(' / ')}
    else bubble('This sample is complete. Select Reset to explore another GrowNomy service.');
    input.value='';
  }
  function reset(){stage=0;record={};log.replaceChildren();bubble(welcome);out.textContent='';input.value='';document.querySelectorAll('[data-prompt]').forEach(b=>b.setAttribute('aria-pressed','false'))}
  document.getElementById('demoForm').addEventListener('submit',e=>{e.preventDefault();chat(input.value)});
  document.querySelectorAll('[data-prompt]').forEach(button=>{button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{reset();button.setAttribute('aria-pressed','true');chat(button.dataset.prompt)})});
  document.getElementById('reset').addEventListener('click',reset);
  document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',()=>document.getElementById('service').value=a.dataset.service));
  let briefUrl;
  document.getElementById('contact').addEventListener('submit',e=>{
    e.preventDefault();
    for(const field of e.target.querySelectorAll('input')){field.value=field.value.trim();field.setCustomValidity(field.required&&!field.value?'Please complete this field.':'')}
    if(!e.target.reportValidity())return;
    const d=Object.fromEntries(new FormData(e.target));
    const text='GROWNOMY — PROJECT BRIEF\n\nName: '+d.name+'\nBusiness: '+d.business+'\nEmail: '+d.email+'\nService: '+d.service+'\n\nCreated from the design demo. No enquiry has been transmitted.';
    if(briefUrl)URL.revokeObjectURL(briefUrl);
    briefUrl=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=briefUrl;a.download='grownomy-project-brief.txt';a.textContent='Download your project brief';
    const status=document.getElementById('formStatus');status.replaceChildren('Your brief is ready. No enquiry has been sent. ',a);a.click();
  });
  document.querySelectorAll('#contact input').forEach(field=>field.addEventListener('input',()=>field.setCustomValidity('')));
  const ambient=document.getElementById('ambientAudio'),keys=document.getElementById('keyboardAudio'),button=document.getElementById('soundToggle');
  let soundOn=false,typing=false;ambient.volume=.18;keys.volume=.22;
  button.textContent='ENABLE SOUND ◌';
  window.setTypingAudio=active=>{typing=active;if(active&&soundOn&&!document.hidden)keys.play().catch(()=>{});else keys.pause()};
  let audioEpoch=0;
  const soundLabel=()=>{button.setAttribute('aria-pressed',String(soundOn));button.textContent=soundOn?'SOUND ON ◉':'ENABLE SOUND ◌'};
  button.addEventListener('click',async()=>{
    const epoch=++audioEpoch;soundOn=!soundOn;soundLabel();
    if(!soundOn){ambient.pause();keys.pause();return}
    try{await ambient.play();if(epoch!==audioEpoch||document.hidden){ambient.pause();return}if(typing)await keys.play()}
    catch{if(epoch===audioEpoch){soundOn=false;ambient.pause();keys.pause();soundLabel()}}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){ambient.pause();keys.pause()}else if(soundOn){ambient.play().catch(()=>{});if(typing)keys.play().catch(()=>{})}});
})();
