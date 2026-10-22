
const courseNavigation=document.querySelector('.course-nav details');
if(courseNavigation&&window.matchMedia('(max-width:800px)').matches)courseNavigation.open=false;
document.querySelectorAll('.self-check').forEach(form=>{
 const result=form.querySelector('.quiz-result');
 form.addEventListener('submit',event=>{
  event.preventDefault();let score=0,answered=0;
  const fields=[...form.querySelectorAll('fieldset')];
  fields.forEach(field=>{
   const selected=field.querySelector('input:checked');
   const feedback=field.querySelector('.feedback');
   if(!feedback.dataset.explanation)feedback.dataset.explanation=feedback.textContent;
   feedback.hidden=false;feedback.classList.remove('wrong');
   if(!selected){feedback.textContent='Choose an answer, then check again.';feedback.classList.add('wrong');return;}
   answered++;const correct=selected.value===field.dataset.answer;
   if(correct)score++;else feedback.classList.add('wrong');
   feedback.textContent=(correct?'Correct. ':'Review this answer. ')+feedback.dataset.explanation;
  });
  result.textContent=`${score} of ${fields.length} correct. ${answered} answered. Review the explanations and try again; results are not saved.`;
  result.focus();
 });
 form.addEventListener('reset',()=>{
  form.querySelectorAll('.feedback').forEach(feedback=>{feedback.hidden=true;if(feedback.dataset.explanation)feedback.textContent=feedback.dataset.explanation;});
  result.textContent='';
 });
});
