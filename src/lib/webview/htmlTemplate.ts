import type { CourseWithInstructor } from '@/types';
import { BASE_URL } from '@/constants/api';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function generateMockCurriculum(course: CourseWithInstructor, isEnrolled: boolean): string {
  const sections = ['Introduction', 'Core Concepts', 'Advanced Topics', 'Projects & Practice', 'Conclusion'];
  const safeLessonsCount = Number.isFinite(Number(course.lessonsCount)) ? Number(course.lessonsCount) : 0;
  const lessonsPerSection = Math.max(1, Math.ceil(safeLessonsCount / sections.length));

  return sections
    .map((section, sIdx) => {
      const lessons = Array.from({ length: lessonsPerSection }, (_, lIdx) => {
        const lessonNum = sIdx * lessonsPerSection + lIdx + 1;
        if (lessonNum > safeLessonsCount) return '';
        const duration = ((lessonNum * 13 + sIdx * 7) % 12) + 5;
        return `
          <div class="lesson-item" data-lesson="lesson_${lessonNum}" onclick="onLessonRowTap('lesson_${lessonNum}')">
            <div class="lesson-icon">${isEnrolled ? '▶' : '🔒'}</div>
            <div class="lesson-info">
              <span class="lesson-title">Lesson ${lessonNum}: ${escapeHtml(section)} Part ${lIdx + 1}</span>
              <span class="lesson-duration">${duration} min</span>
            </div>
            <div class="lesson-check" id="check_lesson_${lessonNum}">✓</div>
          </div>
        `;
      }).join('');
      return `
        <div class="section">
          <div class="section-header">${escapeHtml(section)}</div>
          ${lessons}
        </div>
      `;
    })
    .join('');
}

export function generateCourseHTML(
  course: CourseWithInstructor,
  isEnrolled: boolean,
  isDark: boolean,
  userName: string
): string {
  const safeRating = Number.isFinite(Number(course.rating)) ? Number(course.rating) : 0;
  const safeDuration = Number.isFinite(Number(course.duration)) ? Number(course.duration) : 0;
  const safeLessonsCount = Number.isFinite(Number(course.lessonsCount)) ? Number(course.lessonsCount) : 0;
  const safeEnrollmentCount = Number.isFinite(Number(course.enrollmentCount))
    ? Number(course.enrollmentCount)
    : 0;
  const safePrice = Number.isFinite(Number(course.price)) ? Number(course.price) : 0;
  const safeTags = Array.isArray(course.tags) ? course.tags : [];
  const curriculum = generateMockCurriculum(course, isEnrolled);
  const instructorName = course.instructor?.name ?? 'Unknown Instructor';
  const instructorBio = course.instructor?.bio ?? '';
  const instructorAvatar = course.instructor?.avatar ?? '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="${isDark ? 'dark' : 'light'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>${escapeHtml(course.title)}</title>
  <style>
    :root {
      --primary: #2563eb;
      --primary-light: #eff6ff;
      --success: #22c55e;
      --warning: #f59e0b;
    }
    :root[data-theme="light"], html[data-theme="light"] {
      --bg: #ffffff;
      --surface: #f8fafc;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
    }
    :root[data-theme="dark"], html[data-theme="dark"] {
      --bg: #0f172a;
      --surface: #1e293b;
      --border: #334155;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes riseIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .section-anim {
      animation: riseIn 0.55s ease backwards;
    }
    .section-anim:nth-of-type(1) { animation-delay: 0.05s; }
    .section-anim:nth-of-type(2) { animation-delay: 0.12s; }
    .section-anim:nth-of-type(3) { animation-delay: 0.18s; }
    .section-anim:nth-of-type(4) { animation-delay: 0.24s; }
    .link-out { color: var(--primary); font-weight: 600; text-decoration: none; }
    .hero {
      position: relative;
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      padding: 32px 20px;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 200px; height: 200px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }
    .hero-badge {
      display: inline-block;
      background: rgba(255,255,255,0.15);
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
      backdrop-filter: blur(4px);
    }
    .hero h1 {
      color: white;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 12px;
    }
    .hero-meta {
      display: flex;
      gap: 16px;
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      flex-wrap: wrap;
    }
    .hero-meta span { display: flex; align-items: center; gap: 4px; }
    .hero-user { color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500; margin-bottom: 8px; }
    .rating { color: #fbbf24; font-size: 14px; }
    .section-container { padding: 24px 20px; }
    .section-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--primary);
      display: inline-block;
    }
    .instructor-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .instructor-avatar {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .instructor-name { font-weight: 600; font-size: 15px; color: var(--text); }
    .instructor-bio { font-size: 13px; color: var(--text-muted); margin-top: 4px; line-height: 1.5; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      text-align: center;
    }
    .stat-value { font-size: 20px; font-weight: 700; color: var(--primary); }
    .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .section { margin-bottom: 16px; }
    .section-header {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px 10px 0 0;
      padding: 12px 16px;
      border-bottom: none;
    }
    .lesson-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-top: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .lesson-item:last-child { border-radius: 0 0 10px 10px; }
    .lesson-item:active, .lesson-item:hover { background: var(--surface); }
    .lesson-icon { color: var(--primary); font-size: 13px; flex-shrink: 0; }
    .lesson-info { flex: 1; }
    .lesson-title { font-size: 13px; color: var(--text); display: block; }
    .lesson-duration { font-size: 11px; color: var(--text-muted); }
    .lesson-check { color: var(--success); font-size: 14px; opacity: 0; transition: opacity 0.3s; }
    .lesson-check.completed { opacity: 1; }
    .description-text { font-size: 14px; color: var(--text-muted); line-height: 1.7; }
    .action-bar {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: var(--bg);
      border-top: 1px solid var(--border);
      padding: 16px 20px;
      display: flex;
      gap: 12px;
      backdrop-filter: blur(8px);
    }
    .btn {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: none;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.1s;
    }
    .btn:active { transform: scale(0.97); opacity: 0.9; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-secondary {
      background: var(--surface);
      color: var(--primary);
      border: 1.5px solid var(--border);
    }
    .progress-section { padding: 0 20px 100px; }
    .progress-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
    .progress-bar-bg {
      background: var(--surface);
      border-radius: 99px;
      height: 8px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), #60a5fa);
      border-radius: 99px;
      transition: width 0.5s ease;
      width: 0%;
    }
    .progress-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .tag-chip {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 20px;
      margin: 3px;
      font-weight: 500;
    }
  </style>
</head>
<body>

<div class="hero section-anim">
  <div class="hero-badge">${escapeHtml(course.category)}</div>
  <p class="hero-user" id="lmsHeroUser"></p>
  <h1>${escapeHtml(course.title)}</h1>
  <div class="hero-meta">
    <span><span class="rating">${generateStars(safeRating)}</span> ${safeRating.toFixed(1)}</span>
    <span>⏱ ${safeDuration}h</span>
    <span>📚 ${safeLessonsCount} lessons</span>
    <span>👥 ${safeEnrollmentCount.toLocaleString()} students</span>
  </div>
</div>

<div class="section-container section-anim">
  <div class="section-title">Instructor</div>
  <div class="instructor-card">
    ${
      instructorAvatar
        ? `<img src="${escapeHtml(instructorAvatar)}" class="instructor-avatar" alt="Instructor">`
        : `<div style="width:60px;height:60px;border-radius:30px;background:#2563eb;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:20px;flex-shrink:0">${escapeHtml(instructorName.charAt(0) || '?')}</div>`
    }
    <div>
      <div class="instructor-name">${escapeHtml(instructorName)}</div>
      <div class="instructor-bio">${escapeHtml(instructorBio)}</div>
    </div>
  </div>

  <div class="section-title">Course Overview</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${safeDuration}h</div>
      <div class="stat-label">Duration</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${safeLessonsCount}</div>
      <div class="stat-label">Lessons</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${course.difficulty.charAt(0)}</div>
      <div class="stat-label">${escapeHtml(course.difficulty)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">$${safePrice.toFixed(0)}</div>
      <div class="stat-label">Price</div>
    </div>
  </div>
</div>

<div class="section-container section-anim" style="padding-top:0">
  <div class="section-title">About This Course</div>
  <p class="description-text">${escapeHtml(course.description)}</p>
  <div style="margin-top:12px">
    ${safeTags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
  </div>
</div>

<div class="progress-section section-anim">
  <div class="progress-title">Your Progress</div>
  <div class="progress-bar-bg">
    <div class="progress-bar-fill" id="progressFill"></div>
  </div>
  <div class="progress-label" id="progressLabel">0 / ${safeLessonsCount} lessons completed</div>
</div>

<div class="section-container section-anim" style="padding-top:0;padding-bottom:100px">
  <div class="section-title">Curriculum</div>
  ${curriculum}
  <p style="margin-top:16px;font-size:13px;color:var(--text-muted)">
    <a href="#" class="link-out" onclick="event.preventDefault(); postToNative('OPEN_LINK', { url: '${BASE_URL}' }); return false;">Open course host in browser →</a>
  </p>
</div>

<div class="action-bar">
  <button id="primaryActionBtn" class="btn btn-primary" type="button" onclick="handlePrimaryAction()">
    ${isEnrolled ? '▶ Continue Learning' : '+ Enroll Now'}
  </button>
  <button class="btn btn-secondary" type="button" onclick="shareCourse()">Share</button>
</div>

<script>
  (function() {
    var completedLessons = new Set();
    var totalLessons = ${safeLessonsCount};
    window.__LMS_ENROLLED = ${JSON.stringify(!!isEnrolled)};

    function postToNative(type, payload) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
      } catch (e) {}
    }

    function applyTheme(isDark) {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }

    function applyEnrollment(isEnrolled) {
      window.__LMS_ENROLLED = !!isEnrolled;
      var btn = document.getElementById('primaryActionBtn');
      if (btn) {
        btn.textContent = window.__LMS_ENROLLED ? '▶ Continue Learning' : '+ Enroll Now';
      }
      document.querySelectorAll('.lesson-item').forEach(function (row) {
        var icon = row.querySelector('.lesson-icon');
        if (icon) icon.textContent = window.__LMS_ENROLLED ? '▶' : '🔒';
      });
    }

    window.__lmsApplyNativeMessage = function (msg) {
      if (!msg || !msg.type) return;
      if (msg.type === 'THEME_CHANGE' && msg.payload) {
        applyTheme(!!msg.payload.isDark);
        return;
      }
      if (msg.type === 'ENROLLMENT_UPDATE' && msg.payload) {
        applyEnrollment(!!msg.payload.isEnrolled);
        return;
      }
    };

    function completeLesson(lessonId) {
      if (!window.__LMS_ENROLLED) return;
      completedLessons.add(lessonId);
      var checkEl = document.getElementById('check_' + lessonId);
      if (checkEl) checkEl.classList.add('completed');
      updateProgress();
      postToNative('LESSON_COMPLETE', { lessonId: lessonId });
    }

    window.completeLesson = completeLesson;
    window.completLesson = completeLesson;

    function onLessonRowTap(lessonId) {
      if (!window.__LMS_ENROLLED) {
        postToNative('HAPTIC', { type: 'light' });
        return;
      }
      completeLesson(lessonId);
    }
    window.onLessonRowTap = onLessonRowTap;

    function updateProgress() {
      var count = completedLessons.size;
      var pct = totalLessons > 0 ? Math.round((count / totalLessons) * 100) : 0;
      var fill = document.getElementById('progressFill');
      var label = document.getElementById('progressLabel');
      if (fill) fill.style.width = pct + '%';
      if (label) label.textContent = count + ' / ' + totalLessons + ' lessons completed';
    }

    function handlePrimaryAction() {
      if (!window.__LMS_ENROLLED) {
        postToNative('ENROLL_COURSE', {});
        return;
      }

      var firstLesson = document.querySelector('.lesson-item');
      if (firstLesson && typeof firstLesson.scrollIntoView === 'function') {
        firstLesson.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      postToNative('HAPTIC', { type: 'medium' });
    }
    window.handlePrimaryAction = handlePrimaryAction;

    function shareCourse() {
      postToNative('SHARE_COURSE', {});
    }
    window.shareCourse = shareCourse;

    function syncHeroUser() {
      var el = document.getElementById('lmsHeroUser');
      var n = typeof window.__LMS_USER_NAME === 'string' ? window.__LMS_USER_NAME : '';
      var fallback = ${JSON.stringify(userName.trim() || 'Learner')};
      var label = (n && n.trim()) ? n.trim() : fallback;
      if (el) el.textContent = label ? ('Hi, ' + label) : '';
    }

    document.addEventListener('DOMContentLoaded', function () {
      syncHeroUser();
    });
  })();
</script>
</body>
</html>`;
}
