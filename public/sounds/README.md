# 🔊 Sound Files for Brain Speed Challenge

Thư mục này chứa các file âm thanh cần thiết cho ứng dụng Brain Speed Challenge.

## 📁 Cấu trúc file âm thanh cần thiết:

### Game Actions:
- `correct-ding.mp3` - Tiếng "ding", "chime" vui tươi khi trả lời đúng
- `wrong-buzz.mp3` - Tiếng "buzz", "error" nhẹ nhàng khi trả lời sai
- `timer-tick.mp3` - Tiếng tick-tock khi còn 3 giây
- `time-up-bell.mp3` - Tiếng chuông kết thúc thời gian
- `button-click.mp3` - Tiếng tap/click crisp
- `combo-whoosh.mp3` - Tiếng "whoosh" + "sparkle" cho combo streak

### Battle Mode:
- `match-ready.mp3` - Tiếng "ready fight" khi tìm thấy trận đấu
- `countdown-321go.mp3` - Countdown "3, 2, 1, GO!"
- `victory-fanfare.mp3` - Fanfare ngắn khi thắng
- `defeat-aww.mp3` - Tiếng "aww" thất vọng khi thua
- `notification-ping.mp3` - Notification sound khi có đối thủ mới

### UI Feedback:
- `level-up-achievement.mp3` - Achievement sound khi lên level
- `power-up-magic.mp3` - Magic/boost sound khi kích hoạt power-up
- `page-swoosh.mp3` - Swoosh effect cho page transition
- `notification-gentle.mp3` - Gentle ping cho notification

### Ambient:
- `background-lofi.mp3` - Nhạc nền Lo-fi upbeat (loop)
- `battle-intense.mp3` - Nhạc nhanh cho battle mode

## 🎵 Yêu cầu kỹ thuật:

### Format:
- **Định dạng**: MP3 hoặc OGG
- **Bitrate**: 128-192 kbps
- **Sample Rate**: 44.1 kHz

### Độ dài:
- **Sound Effects**: 0.5-3 giây
- **Music**: Có thể loop được (30-60 giây)
- **Voice**: 1-2 giây

### Âm lượng:
- Đã được normalize và balanced
- Không quá lớn hoặc quá nhỏ
- Tương thích với web audio API

## 📱 Tối ưu cho Mobile:

- File size nhỏ gọn (dưới 100KB cho effects)
- Tương thích với iOS Safari và Android Chrome
- Hỗ trợ autoplay policies

## 🎮 Cách sử dụng:

Các file âm thanh này sẽ được tự động load bởi Audio Manager:

\`\`\`typescript
import { audioManager } from '@/lib/audio-manager'

// Phát âm thanh
audioManager.playSound('correct-answer')
audioManager.playCorrectAnswer(streak)
audioManager.playBackgroundMusic('background-music')
\`\`\`

## 📦 Nguồn âm thanh được đề xuất:

### Free Resources:
- **Freesound.org** - Cộng đồng chia sẻ âm thanh miễn phí
- **Pixabay** - Thư viện âm thanh và nhạc miễn phí  
- **OpenGameArt.org** - Tài nguyên game miễn phí
- **Incompetech** - Nhạc nền miễn phí từ Kevin MacLeod

### Premium Resources:
- **AudioJungle** - Marketplace âm thanh chất lượng cao
- **Adobe Stock Audio** - Thư viện âm thanh professional
- **Epidemic Sound** - Dịch vụ âm nhạc subscription

## ⚠️ Lưu ý bản quyền:

Đảm bảo tất cả file âm thanh:
- ✅ Có license thương mại (nếu cần)
- ✅ Attribution đúng quy định
- ✅ Không vi phạm bản quyền
- ✅ Phù hợp cho sử dụng web/game

## 🔧 Cài đặt và Test:

1. Thêm file âm thanh vào thư mục này
2. Restart development server
3. Test trong trình duyệt (Chrome, Firefox, Safari)
4. Test trên mobile devices
5. Kiểm tra performance và loading time

---

💡 **Mẹo**: Sử dụng tool như Audacity để edit và optimize file âm thanh trước khi sử dụng. 