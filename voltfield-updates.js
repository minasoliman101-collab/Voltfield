/* VOLTFIELD - email updates signup.
   Upgrades every <form class="vfu-form"> (Netlify form "site-updates") to post
   in the background and confirm inline. Without this script the same form
   still posts natively and Netlify shows its default success page. */
(function(){
  function encode(fd){
    var out=[];
    fd.forEach(function(v,k){out.push(encodeURIComponent(k)+'='+encodeURIComponent(v));});
    return out.join('&');
  }
  function bind(form){
    var msg=form.querySelector('.vfu-msg');
    var btn=form.querySelector('button[type=submit]');
    function show(text,cls){if(msg){msg.textContent=text;msg.className='vfu-msg '+cls;}}
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var email=form.querySelector('input[type=email]');
      if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())){
        show('Add a valid email address.','err');return;
      }
      var label=btn.textContent; btn.textContent='Sending\u2026'; btn.disabled=true;
      fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:encode(new FormData(form))})
        .then(function(r){
          if(!r.ok)throw new Error('status '+r.status);
          show('You\u2019re on the list. Look for the next update in your inbox.','ok');
          email.value='';
        })
        .catch(function(){
          show('Signup isn\u2019t reachable from here. Email Help@voltfield.org and we\u2019ll add you.','err');
        })
        .then(function(){btn.textContent=label;btn.disabled=false;});
    });
  }
  function init(){
    var forms=document.querySelectorAll('form.vfu-form');
    for(var i=0;i<forms.length;i++)bind(forms[i]);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
