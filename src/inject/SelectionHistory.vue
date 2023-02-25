<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue"
import urlcat from "urlcat"
import HeartIcon from "vue-material-design-icons/Heart.vue"
import { CafeMusicInfo, Reason, User } from "./window"
import "./kiiteLike.scss"

const history = ref<CafeMusicInfo[]>([])
const historyPpReasons = computed<
  ((Reason & { type: "priority_playlist" }) | undefined)[]
>(() =>
  history.value.map(
    (m) =>
      m.reasons.find((r) => r.type === "priority_playlist") as
        | (Reason & { type: "priority_playlist" })
        | undefined
  )
)
const users = ref<Map<number, User>>(new Map())
const rotateUsers = ref<Map<number, number[]>>(new Map())

onMounted(async () => {
  console.log("History: Mounted, fetching timetable")
  while (true) {
    history.value = await fetch(
      urlcat("https://cafe.kiite.jp/api/cafe/timetable", {
        limit: 100,
        with_comment: 1,
      })
    ).then((res) => res.json())
    const startTime = new Date(history.value[0].start_time)
    const endTime = startTime.getTime() + history.value[0].msec_duration
    const now = new Date()
    console.log("History: Fetched timetable, waiting for next update")
    const nextUpdate = new Date(Math.max(endTime, now.getTime() + 1000))
    const diff = nextUpdate.getTime() - now.getTime()
    console.log(
      `History: Next update at ${nextUpdate.toLocaleString()}, waiting ${diff}ms`
    )
    await new Promise((resolve) => setTimeout(resolve, diff))
  }
})

const lastNewFavsCount = ref(0)
const lastGesturesCount = ref(0)

let fetchInterval: NodeJS.Timer | null = null
onMounted(async () => {
  while (!history.value[0]) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  fetchInterval = setInterval(async () => {
    console.log("History: Fetching favs and gestures")
    const [favs, gestures] = await Promise.all([
      fetch(
        urlcat("https://cafe.kiite.jp/api/cafe/new_fav", {
          id: history.value[0].id,
        })
      ).then((res) => res.json()),
      fetch(
        urlcat("https://cafe.kiite.jp/api/cafe/user_gestures", {
          id: history.value[0].id,
        })
      ).then((res) => res.json()),
    ])

    lastNewFavsCount.value = favs.length
    lastGesturesCount.value = Object.values(gestures).length
    console.log(`History: Fetched favs and gestures, waiting for 5s`)
    console.log(
      `History: Favs: ${lastNewFavsCount.value}, Gestures: ${lastGesturesCount.value}`
    )
  }, 5000)
})

onUnmounted(() => {
  if (fetchInterval) clearInterval(fetchInterval)
})

watchEffect(async () => {
  const userIds = new Set(
    historyPpReasons.value
      .filter((r) => r)
      .map((r) => r!.user_id)
      .filter((id) => !users.value.has(id))
  )
  if (userIds.size === 0) return
  console.log(`History: Fetching ${userIds.size} users`)

  const usersRes = await fetch(
    urlcat("https://cafe.kiite.jp/api/kiite_users", {
      user_ids: [...userIds].join(","),
    })
  ).then((res) => res.json())
  users.value = new Map([
    ...users.value,
    ...usersRes.map((u: User) => [u.user_id, u]),
  ])
  console.log(
    `History: Fetched ${usersRes.length} users, total ${users.value.size}`
  )
})

watchEffect(async () => {
  const playIds = new Set(
    history.value.map((r) => r.id).filter((id) => !users.value.has(id))
  )
  if (playIds.size === 0) return
  console.log(`History: Fetching ${playIds.size} plays`)

  const usersRes: Record<string, number[]> = await fetch(
    urlcat("https://cafe.kiite.jp/api/cafe/rotate_users", {
      ids: [...playIds].join(","),
    })
  ).then((res) => res.json())
  rotateUsers.value = new Map([
    ...rotateUsers.value.entries(),
    ...Object.entries(usersRes).map(
      ([id, users]) => [parseInt(id), users] as const
    ),
  ])
})

const formatRelativeTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const diffSec = diff / 1000
  const diffMin = diffSec / 60
  const diffHour = diffMin / 60
  const diffDay = diffHour / 24
  if (diffDay > 1) {
    return `${Math.floor(diffDay)}日前`
  } else if (diffHour > 1) {
    return `${Math.floor(diffHour)}時間前`
  } else if (diffMin > 1) {
    return `${Math.floor(diffMin)}分前`
  } else {
    return `${Math.floor(diffSec)}秒前`
  }
}
</script>

<template>
  <div id="about_desktop">
    <div class="logo_mini">
      <div class="logo_inner">
        <img src="https://cafe.kiite.jp/assets/logo.png" />
        <div class="logo_cafe">Cafe</div>
      </div>
    </div>

    <div class="inner">
      <h2>選曲履歴100</h2>
      <div class="exp">
        Kiite Cafe
        にログインしているユーザの、プレイリストやお気に入り、イチ推しリストから自動的に選曲されます<br />
        毎晩21時から発掘タイムです
      </div>
      <ul id="history">
        <li v-for="(music, i) of history" :key="music.id" class="history-item">
          <div
            class="thumbnail"
            :style="{
              backgroundImage: `url(${music.thumbnail})`,
            }"
          ></div>
          <div class="info">
            <div class="play-info">
              <span v-if="i === 0" class="time time-onair">ON AIR</span>
              <span v-else class="time">{{
                formatRelativeTime(music.start_time)
              }}</span>
              <div
                v-if="historyPpReasons[i] && users.has(historyPpReasons[i]!.user_id)"
                class="reason-info"
              >
                <a
                  :href="
                `https://kiite.jp/user/${users.get(historyPpReasons[i]!.user_id)!.user_name}`
                "
                  target="_blank"
                >
                  <img
                    :src="users.get(historyPpReasons[i]!.user_id)!.avatar_url"
                    class="user-icon"
                  />
                  <span class="user">{{
                    users.get(historyPpReasons[i]!.user_id)!.nickname
                  }}</span> </a
                >さんの<span class="priority-playlist">イチ推し</span>
              </div>
            </div>
            <div class="title">{{ music.title }}</div>
            <div class="artist">{{ music.artist_name }}</div>
            <div class="stats">
              <div class="flex-grow" />
              <div class="rotate item">
                <div class="rotate-text stat-label">回</div>
                {{
                  i === 0
                    ? lastGesturesCount
                    : rotateUsers.get(music.id)?.length || 0
                }}
              </div>
              <div class="favs item">
                <div class="favs-icon stat-label">
                  <HeartIcon class="favs-outside" :size="14" />
                  <HeartIcon class="favs-inside" :size="14" />
                </div>
                {{
                  i === 0 ? lastNewFavsCount : music.new_fav_user_ids?.length
                }}
              </div>
            </div>
            <div v-if="historyPpReasons[i]?.playlist_comment" class="comment">
              <img
                :src="users.get(historyPpReasons[i]!.user_id)!.avatar_url"
                class="comment-user-icon"
              />
              <div class="comment-text">
                {{ historyPpReasons[i]?.playlist_comment }}
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.logo_mini {
  display: none;
  opacity: 0.7;
  position: absolute;
  left: 0px;
  top: 30px;
  z-index: 40;
  text-align: center;
  height: 100px;
  width: 120px;
  img {
    width: 70px;
  }

  .logo_cafe {
    margin-top: 5px;
    font-size: 10px;
  }
}

.exp {
  margin: 20px 10px 0px 40px;
  line-height: 1.5em;

  b {
    font-weight: bold;
    color: cyan;
  }
}

#pri_playlist .detail ul.playlist_songs {
  margin-top: 30px;
}

#history {
  display: flex;
  flex-direction: column;

  padding: 0 40px;
}
.history-item {
  position: relative;
  margin-bottom: 8px;
  display: flex;
  .thumbnail {
    aspect-ratio: 1;
    background-position: center center;
    background-size: 180%;
    border-radius: 20%;
    height: 60px;
  }

  .info {
    position: relative;
    flex-grow: 1;
    margin-left: 5px;
    background: rgba(0, 0, 0, 0.8);
    padding: 10px 15px;
    .play-info {
      position: relative;
      margin: 0;
      margin-bottom: 5px;
      display: flex;
      .time {
        color: #aaa;
        background: #333;
        font-size: 0.7em;
        line-height: 18px;
        text-align: center;
        z-index: 1;
        padding: 0px 10px;

        &.time-onair {
          background: #f00;
          color: #fff;
        }
      }

      .reason-info {
        height: 18px;
        padding-left: 20px;
        display: flex;
        align-items: center;
        color: #aaa;

        a {
          display: flex;
          align-items: center;
          color: #fff;
        }

        .priority-playlist {
          color: #0ff;
        }
      }
      .user-icon {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        margin-right: 5px;
        display: inline-block;
      }
    }

    .title {
      display: block;
      font-size: 1.2em;
      line-height: 1.3em;
      margin: 0;
    }

    .artist {
      margin: 0;
      margin-top: 5px;
      color: #aaa;
    }

    .stats {
      display: flex;
      align-items: center;

      .flex-grow {
        flex-grow: 1;
      }

      .item {
        display: flex;
        align-items: center;
        width: 100px;
      }

      .stat-label {
        margin-right: 5px;
      }
      .favs {
        .favs-icon {
          height: 14px;
          width: 14px;
          display: inline-block;
          position: relative;

          * {
            position: absolute;
            inset: 0;
          }

          color: #f3a;
          .favs-outside {
            opacity: 0.5;
          }
          .favs-inside {
            transform: scale(0.6);
            transform-origin: bottom;
          }
        }
      }
      .rotate-text {
        color: #ff0;
      }
    }

    .comment {
      display: flex;
      margin-top: 10px;

      .comment-user-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 10px;
      }
      .comment-text {
        border-radius: 0.3em 0.3em 0.3em 0.3em;
        font-size: 1.1em;
        background: #e0ffff;
        padding: 8px;
        margin-right: 50px;
        color: black;
        line-height: 1.4em;
        overflow-y: scroll;
      }
    }
  }
}
</style>
