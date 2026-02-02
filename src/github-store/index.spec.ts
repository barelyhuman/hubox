import * as os from 'os'
import * as path from 'path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationManager } from './index'

describe('NotificationManager', () => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
  const getTestStorage = () =>
    path.join(os.tmpdir(), `hubox-test-${Date.now()}-${Math.random()}`)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('respects maxActive limit for in-progress notifications', async function () {
    if (!GITHUB_TOKEN) {
      console.log('Skipping test: GITHUB_TOKEN not set')
      return
    }

    const maxActive = 3
    const manager = new NotificationManager(
      GITHUB_TOKEN,
      maxActive,
      getTestStorage()
    )
    const notifications = await manager.getInProgress()

    expect(notifications.length).to.be.at.most(maxActive)
  })

  it('marks notifications as read', async function () {
    if (!GITHUB_TOKEN) {
      console.log('Skipping test: GITHUB_TOKEN not set')
      return
    }

    const manager = new NotificationManager(GITHUB_TOKEN, 10, getTestStorage())
    const notifications = await manager.getInProgress()

    const notifId = notifications[0].id

    await manager.markAsRead(notifId)
    const updated = await manager.getAll()
    const updatedNotif = updated.find(n => n.id === notifId)

    expect(updatedNotif?.isRead).to.be.true
  })

  it('marks notifications as done', async function () {
    if (!GITHUB_TOKEN) {
      console.log('Skipping test: GITHUB_TOKEN not set')
      return
    }

    const manager = new NotificationManager(GITHUB_TOKEN, 10, getTestStorage())
    const notifications = await manager.getInProgress()

    const notifId = notifications[0].id

    await manager.markAsDone(notifId)
    const updated = await manager.getAll()
    const updatedNotif = updated.find(n => n.id === notifId)

    expect(updatedNotif?.isDone).to.be.true
  })

  it('excludes done notifications from in-progress list', async function () {
    if (!GITHUB_TOKEN) {
      console.log('Skipping test: GITHUB_TOKEN not set')
      return
    }

    const manager = new NotificationManager(GITHUB_TOKEN, 10, getTestStorage())
    const inProgress = await manager.getInProgress()

    const notifId = inProgress[0].id
    await manager.markAsDone(notifId)

    const updatedInProgress = await manager.getInProgress()
    const isDoneStillInProgress = updatedInProgress.some(n => n.id === notifId)

    expect(isDoneStillInProgress).to.be.false
  })

  it('only includes Issues in the in-progress inbox and maintains the max limit', function () {
    const manager = new NotificationManager('', 3, getTestStorage())
    // Prepare fake notifications with mixed types
    manager['allNotifications'] = [
      {
        id: '1',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'a',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-01T00:00:00Z',
        unread: true,
        url: '',
      },
      {
        id: '2',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'b',
          type: 'PullRequest',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-02T00:00:00Z',
        unread: true,
        url: '',
      },
      {
        id: '3',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'c',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-03T00:00:00Z',
        unread: true,
        url: '',
      },
      {
        id: '4',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'd',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-04T00:00:00Z',
        unread: true,
        url: '',
      },
      {
        id: '5',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'e',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-05T00:00:00Z',
        unread: true,
        url: '',
      },
    ]

    // Trigger list computation
    ;(manager as any).updateInProgressList()

    const inProgress = (manager as any).inProgressNotifications as any[]
    expect(inProgress.length).to.equal(3)
    expect(inProgress.some(n => n.subject.type !== 'Issue')).to.be.false
  })

  it('refills inbox when items are marked done', async function () {
    const manager = new NotificationManager('', 3, getTestStorage())

    // Mock the Octokit markThreadAsDone method to prevent actual GitHub API calls
    vi.spyOn(manager['okit'].activity, 'markThreadAsDone').mockResolvedValue(
      {} as any
    )

    // Create 5 issue notifications (newest to oldest)
    manager['allNotifications'] = [
      {
        id: '1',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'a',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-01T00:00:00Z',
        unread: true,
        url: '',
      },
      {
        id: '2',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'b',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-02T00:00:00Z',
        unread: true,
        url: '',
      },
      {
        id: '3',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'c',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-03T00:00:00Z',
        unread: true,
        url: '',
      },
      {
        id: '4',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'd',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-04T00:00:00Z',
        unread: true,
        url: '',
      },
      {
        id: '5',
        reason: '',
        repository: { full_name: 'r', owner: { login: 'o' }, name: 'r' },
        subject: {
          title: 'e',
          type: 'Issue',
          url: null,
          latest_comment_url: null,
        },
        updated_at: '2026-01-05T00:00:00Z',
        unread: true,
        url: '',
      },
    ]

    ;(manager as any).updateInProgressList()
    let inProgress = (manager as any).inProgressNotifications as any[]

    // Newest first
    expect(inProgress.map(n => n.id)).to.deep.equal(['5', '4', '3'])

    // Mark the newest as done and ensure it is replaced by the next item
    await manager.markAsDone('5')

    inProgress = (manager as any).inProgressNotifications as any[]
    expect(inProgress.length).to.equal(3)
    expect(inProgress.map(n => n.id)).to.include('2')
    expect(inProgress.some(n => n.id === '5')).to.be.false
  })
})
