/**
 * Board.js - Firebase Realtime Database Integration Module
 * 
 * 이 모듈은 학교 커뮤니티 게시판의 실시간 CRUD를 담당합니다.
 * Firebase SDK 연결 시 아래의 메서드들을 활용하여 데이터 동기화를 구현할 수 있습니다.
 */

class BoardManager {
    constructor() {
        this.postList = document.getElementById('post-list');
        this.posts = [];
        this.init();
    }

    init() {
        console.log("Board Module Initialized. Ready for Firebase integration.");
        // Firebase 리스너 연결 예시 (실제 연결 시 주석 해제)
        // this.listenToPosts();
    }

    /**
     * [READ] 실시간 데이터 감시 및 UI 업데이트
     * Firebase의 onValue 또는 onChildAdded를 연동하여 실시간성을 확보합니다.
     */
    listenToPosts() {
        /* 
        const postsRef = ref(db, 'posts');
        onValue(postsRef, (snapshot) => {
            const data = snapshot.val();
            this.renderPosts(data);
        });
        */
    }

    /**
     * [CREATE] 새 게시글 작성
     * @param {string} title - 게시글 제목
     * @param {string} content - 게시글 내용
     */
    async createPost(title, content) {
        console.log(`Creating Post: ${title}`);
        /*
        const newPostRef = push(ref(db, 'posts'));
        await set(newPostRef, {
            title,
            content,
            timestamp: Date.now()
        });
        */
        
        // UI 피드백 (데모용)
        const newItem = document.createElement('li');
        newItem.className = 'board-item';
        newItem.innerHTML = `
            <div>${title}</div>
            <span>방금 전</span>
        `;
        this.postList.prepend(newItem);
    }

    /**
     * [UPDATE] 게시글 수정
     * @param {string} postId - 게시글 고유 ID
     * @param {object} newData - 수정할 데이터 객체
     */
    async updatePost(postId, newData) {
        console.log(`Updating Post: ${postId}`);
        /*
        const postRef = ref(db, `posts/${postId}`);
        await update(postRef, newData);
        */
    }

    /**
     * [DELETE] 게시글 삭제
     * @param {string} postId - 게시글 고유 ID
     */
    async deletePost(postId) {
        console.log(`Deleting Post: ${postId}`);
        /*
        const postRef = ref(db, `posts/${postId}`);
        await remove(postRef);
        */
    }

    /**
     * UI 렌더링 엔진
     */
    renderPosts(data) {
        if (!data) return;
        this.postList.innerHTML = '';
        Object.entries(data).reverse().forEach(([id, post]) => {
            const li = document.createElement('li');
            li.className = 'board-item';
            li.innerHTML = `
                <div>${post.title}</div>
                <span>${new Date(post.timestamp).toLocaleDateString()}</span>
            `;
            this.postList.appendChild(li);
        });
    }
}

// 모듈 인스턴스화
const board = new BoardManager();

// 이벤트 리스너: 글쓰기 버튼 (데모)
document.querySelector('.board-header button').addEventListener('click', () => {
    const title = prompt("게시글 제목을 입력하세요:");
    if (title) {
        board.createPost(title, "내용 없음");
    }
});
