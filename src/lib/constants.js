export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const LESSON_STATUS = {
  SCHEDULED: {
    value: 'scheduled',
    label: 'CHỜ DẠY',
    color: 'bg-orange-400',       // Màu dùng cho nút/badge đậm
    lightColor: 'bg-orange-50',   // Màu nền nhạt
    textColor: 'text-orange-600'  // Màu chữ
  },
  ATTENDED: {
    value: 'attended',
    label: 'ĐÃ DẠY XONG',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  TEACHER_OFF: {
    value: 'teacher_off',
    label: 'GIÁO VIÊN NGHỈ',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600'
  },
  ABSENT: {
    value: 'absent',
    label: 'HỌC VIÊN NGHỈ',
    color: 'bg-slate-400',
    lightColor: 'bg-slate-50',
    textColor: 'text-slate-600'
  }
};

// Hàm tiện ích để lấy thông tin status dựa vào value
export const getStatusInfo = (statusValue) => {
  return Object.values(LESSON_STATUS).find(s => s.value === statusValue) || LESSON_STATUS.SCHEDULED;
};