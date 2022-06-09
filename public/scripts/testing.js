document.getElementById('testing-btn').addEventListener('click', async () => {
  alert('the button was clicked');
  await fetch('/api/testing');
});
