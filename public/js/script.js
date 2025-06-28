$(document).ready(function() {
  // Check authentication status
  checkAuth();
  
  // Register form submission
  $('#registerForm').submit(function(e) {
    e.preventDefault();
    const username = $('#username').val();
    const email = $('#email').val();
    const password = $('#password').val();
    const confirmPassword = $('#confirmPassword').val();
    
    if (password !== confirmPassword) {
      $('#registerError').text('Passwords do not match').show();
      return;
    }
    
    $.ajax({
      url: '/api/auth/register',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ username, email, password }),
      success: function() {
        window.location.href = '/login';
      },
      error: function(xhr) {
        $('#registerError').text(xhr.responseJSON.error).show();
      }
    });
  });
  
  // Login form submission
  $('#loginForm').submit(function(e) {
    e.preventDefault();
    const email = $('#email').val();
    const password = $('#password').val();
    
    $.ajax({
      url: '/api/auth/login',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email, password }),
      success: function(response) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        window.location.href = '/';
      },
      error: function(xhr) {
        $('#loginError').text(xhr.responseJSON.error).show();
      }
    });
  });
  
  // Logout
  $('#logoutLink').click(function(e) {
    e.preventDefault();
    $.ajax({
      url: '/api/auth/logout',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      success: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    });
  });
  
  // Create quiz form submission
  $('#quizForm').submit(function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('question', $('#question').val());
    formData.append('option1Text', $('#option1Text').val());
    formData.append('option2Text', $('#option2Text').val());
    formData.append('correctOption', $('input[name="correctOption"]:checked').val());
    
    const option1Image = $('#option1Image')[0].files[0];
    const option2Image = $('#option2Image')[0].files[0];
    
    if (option1Image) formData.append('option1Image', option1Image);
    if (option2Image) formData.append('option2Image', option2Image);
    
    $.ajax({
      url: '/api/quiz',
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      success: function() {
        $('#quizSuccess').text('Quiz created successfully!').show();
        $('#quizForm')[0].reset();
        setTimeout(() => $('#quizSuccess').hide(), 3000);
      },
      error: function(xhr) {
        $('#quizError').text(xhr.responseJSON.error).show();
      }
    });
  });
  
  // Load quizzes for playing
  if (window.location.pathname === '/play-quiz') {
    loadQuizzes();
  }
  
  // Load leaderboard
  if (window.location.pathname === '/leaderboard') {
    loadLeaderboard();
  }
});

function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || null);
  
  if (token && user) {
    $('#authLinks').hide();
    $('#userLinks').show();
    $('.navbar-nav').append(`<span class="nav-link">Hello, ${user.username} (${user.score} pts)</span>`);
  } else {
    $('#authLinks').show();
    $('#userLinks').hide();
  }
}

function loadQuizzes() {
  $.ajax({
    url: '/api/quiz',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
    success: function(quizzes) {
      if (quizzes.length === 0) {
        $('#quizContainer').html('<p>No quizzes available. Be the first to create one!</p>');
        return;
      }
      
      // Display a random quiz
      const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      displayQuiz(randomQuiz);
    },
    error: function(xhr) {
      $('#quizContainer').html('<div class="alert alert-danger">Error loading quizzes</div>');
    }
  });
}

function displayQuiz(quiz) {
  const quizHtml = `
    <div class="quiz-question">
      <h4 class="text-center mb-4">${quiz.question}</h4>
      <div class="row">
        <div class="col-md-6 mb-3">
          <div class="card option-card" data-option="option1">
            <div class="card-body text-center">
              ${quiz.option1.image ? `<img src="${quiz.option1.image}" class="img-fluid mb-3" alt="Option 1">` : ''}
              <h5>${quiz.option1.text}</h5>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-3">
          <div class="card option-card" data-option="option2">
            <div class="card-body text-center">
              ${quiz.option2.image ? `<img src="${quiz.option2.image}" class="img-fluid mb-3" alt="Option 2">` : ''}
              <h5>${quiz.option2.text}</h5>
            </div>
          </div>
        </div>
      </div>
      <input type="hidden" id="quizId" value="${quiz._id}">
    </div>
  `;
  
  $('#quizContainer').html(quizHtml);
  
  $('.option-card').click(function() {
    const selectedOption = $(this).data('option');
    const quizId = $('#quizId').val();
    
    $.ajax({
      url: `/api/quiz/${quizId}/answer`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ selectedOption }),
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      success: function(response) {
        const user = JSON.parse(localStorage.getItem('user'));
        user.score = response.score;
        localStorage.setItem('user', JSON.stringify(user));
        
        if (response.correct) {
          $('#resultAlert').removeClass('alert-danger').addClass('alert-success')
            .text('Correct! +10 points').show();
        } else {
          $('#resultAlert').removeClass('alert-success').addClass('alert-danger')
            .text('Incorrect! Try another quiz').show();
        }
        
        // Disable further clicks
        $('.option-card').off('click');
        
        // Show next button
        $('#quizContainer').append(`
          <div class="text-center mt-3">
            <button id="nextQuiz" class="btn btn-primary">Next Quiz</button>
          </div>
        `);
        
        $('#nextQuiz').click(function() {
          loadQuizzes();
          $('#resultAlert').hide();
        });
      }
    });
  });
}

function loadLeaderboard() {
  $.ajax({
    url: '/api/user/leaderboard',
    method: 'GET',
    success: function(users) {
      let leaderboardHtml = '';
      users.forEach((user, index) => {
        leaderboardHtml += `
          <tr>
            <td>${index + 1}</td>
            <td>${user.username}</td>
            <td>${user.score}</td>
          </tr>
        `;
      });
      $('#leaderboardBody').html(leaderboardHtml);
    },
    error: function() {
      $('#leaderboardBody').html('<tr><td colspan="3" class="text-center">Error loading leaderboard</td></tr>');
    }
  });
}