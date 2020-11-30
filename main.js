const SERVER_URL = '';
const SPOILER_TARGET_ROOM = '';
const BLANK = '\u200b'.repeat(500);
const HELP = '[[도움말]]' + BLANK + '\n'
    + '/CF : 예정된 코드포스 라운드 목록을 출력합니다.\n'
    + '/CF {{handle}} : 유저의 코드포스 레이팅을 출력합니다.\n'
    + '/sp {{query}} : 쿼리에 맞는 문제를 최대 5개까지 보여줍니다.(spoiler alert!)\n'
    + '/rp {{query}} : 쿼리에 맞는 문제 중 하나를 랜덤으로 뽑아줍니다.\n'
    + '/solved {{id}} : 해당 유저의 solvedac 정보를 출력합니다.\n'
    + '/ptag {{problem}} : 해당 문제의 알고리즘 태그를 출력합니다.(spoiler alert!)\n'
    + '/spoiler {{title}}\\n\\n{{content}} : Spoler Alert!\n'
    + '\n'
    + 'sp와 rp 명령어의 query 부분은 solvedac의 고급검색 쿼리와 동일합니다.\n'
    + '스포일러가 될 수 있는 명령어는 \'전체 보기\'를 눌러야 결과를 볼 수 있습니다.';

const Util = {
    read_path : function(url){
        if(url.includes('http://') || url.includes('https://')){
            let bufferedReader = new java.io.BufferedReader(new java.io.InputStreamReader(java.net.URL(url).openStream()));
            let ret = '', temp = '';
            while((temp = bufferedReader.readLine()) != null) ret += temp + '\n';
            bufferedReader.close();
            return ret;
        }
        if(url.includes('file://')){
            let file = new java.io.File(url.replace('file://', ''));
            if(!(file.exists())) return '';
            let fis = new java.io.FileInputStream(file);
            let isr = new java.io.InputStreamReader(fis);
            let br = new java.io.BufferedReader(isr);
            let ret = br.readLine(), temp = '';
            while((temp = br.readLine()) != null) ret += '\n' + temp;
            fis.close();
            isr.close();
            br.close();
            return ret;
        }
    }
};

const Codeforces = {
    getRound : () => Util.read_path(SERVER_URL + '/codeforces/round'),
    getUser : handle => Util.read_path(SERVER_URL + '/codeforces/user/' + handle)
};
const BOJ = {
    getUser : handle => Util.read_path(SERVER_URL + '/boj/user/' + handle),
    getRandomProblem : query => Util.read_path(SERVER_URL + '/boj/random_problem/' + encodeURI(query)),
    searchProblem : query => Util.read_path(SERVER_URL + '/boj/search_problem/' + encodeURI(query)),
    getProblemTag : prob => Util.read_path(SERVER_URL + '/boj/tag/' + prob)
};
const Spoiler = {
    make : function(sender, msg){
        if(!msg.includes('\n\n')){
            return '[[spoiler by ' + sender + ']]\n' + BLANK + '\n' + msg.replace('/spoiler ', '');
        }
        const arr = msg.split('\n\n');
        const title = arr[0]; arr.shift();
        const content = arr.join('\n\n');
        return '[[spoiler by ' + sender + ']]\n' + title + BLANK + '\n' + content;
    }
};

const CommandExecutor = {
    tokenize : function(cmdString){
        const arr = cmdString.split(' ');
        let ret = {
            prefix: arr[0][0],
            op: arr[0].substr(1),
            paramCount: 0,
            paramAll: ''
        };
        for(let i=1; i<arr.length; i++){
            ret.paramAll += arr[i] + ' ';
            ret['param' + i.toString()] = arr[i];
            ret.paramCount++;
        }
        return ret;
    },
    getResult : function(cmdString){
        const cmd = this.tokenize(cmdString);
        if(cmd.prefix !== '/') return;
        if(cmd.op === 'help'){
            return HELP;
        }
        if(cmd.op === 'cf' && cmd.paramCount === 0){
            return Codeforces.getRound();
        }
        if(cmd.op === 'cf' && cmd.hasOwnProperty('param1')){
            return Codeforces.getUser(cmd.param1);
        }
        if(cmd.op === 'rp' && cmd.paramCount > 0){
            return BOJ.getRandomProblem(cmd.paramAll);
        }
        if(cmd.op === 'sp' && cmd.paramCount > 0){
            let prefix = '[[' + cmd.paramAll + ']]\nSpoiler Alert!' + BLANK;
            return prefix + BOJ.searchProblem(cmd.paramAll);
        }
        if(cmd.op === 'solved' && cmd.hasOwnProperty('param1')){
            return BOJ.getUser(cmd.param1);
        }
        if(cmd.op === 'ptag' && cmd.hasOwnProperty('param1')){
            let prefix = '[[' + cmd.param1 + '\'s tag]]\nlink : http://icpc.me/' + cmd.param1 + '\nSpoiler Alert!' + BLANK;
            return prefix + BOJ.getProblemTag(cmd.param1);
        }
    },
    run : function(replier, cmdString){
        let res = this.getResult(cmdString);
        if(res === undefined) return;
        replier.reply(this.getResult(cmdString));
    }
};

const Test = {
    describe : function(des, cmdString){
        return cmdString + ' : ' + des + '\n' + CommandExecutor.getResult(cmdString);
    },
    run : function(){
        let ret = '';
        ret += this.describe('help', '/help') + '\n\n';
        ret += this.describe('Codeforces Round', '/cf') + '\n\n';
        ret += this.describe('Codeforces User(Normal)', '/cf tourist') + '\n\n';
        ret += this.describe('Codeforces User(Never Participate)', '/cf MikeMirzayanov') + '\n\n';
        ret += this.describe('Codeforces User(Not Exist)', '/cf tourist917') + '\n\n';
        ret += this.describe('BOJ User(Normal)', '/solved jhnah917') + '\n\n';
        ret += this.describe('BOJ User(Not Exist)', '/solved jhnan918') + '\n\n';
        ret += this.describe('BOJ Random Problem(Normal)', '/rp tier:d5..d1 tag:tag:segtree') + '\n\n';
        ret += this.describe('BOJ Random Problem(Not Exist)', '/rp tier:b5 tag:tag:segtree') + '\n\n';
        ret += this.describe('BOJ Search Problem(Normal)', '/sp tier:d5..d1 tag:tag:segtree') + '\n\n';
        ret += this.describe('BOJ Search Problem(Not Exist)', '/sp tier:b5 tag:tag:segtree') + '\n\n';
        ret += this.describe('BOJ Search Problem(Contain /)', '/sp </span>') + '\n\n';
        ret += this.describe('BOJ Problem Tag(Normal)', '/ptag 1000') + '\n\n';
        ret += this.describe('BOJ Problem Tag(Not Exist)', '/ptag 917') + '\n\n';
        return ret;
    }
};

function response(room, msg, sender, isGroup, replier){
    if(msg[0] !== '/') return;
    if(msg.split(' ')[0] === '/spoiler'){
        const content = msg.replace('/spoiler ', '');
        replier.reply(SPOILER_TARGET_ROOM, Spoiler.make(sender, content));
        return;
    }
    if(msg === '/test'){
        replier.reply('Testing...');
        replier.reply(Test.run());
        return;
    }
    if(isGroup && !room.includes('BOT')) return;
    CommandExecutor.run(replier, msg);
}