/* eslint-disable react/no-unknown-property */
import { CloseOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons'
import { isMac, isWindows } from '@renderer/config/constant'
import { useBridge } from '@renderer/hooks/useBridge'
import store from '@renderer/store'
import { setMinappShow } from '@renderer/store/runtime'
import { MinAppType } from '@renderer/types'
import { Drawer } from 'antd'
import { WebviewTag } from 'electron'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { TopView } from '../TopView'

interface Props {
  app: MinAppType
  resolve: (data: any) => void
}

const PopupContainer: React.FC<Props> = ({ app, resolve }) => {
  const [open, setOpen] = useState(true)
  const webviewRef = useRef<WebviewTag | null>(null)

  useBridge()

  const canOpenExternalLink = app.url.startsWith('http://') || app.url.startsWith('https://')

  const onClose = () => {
    setOpen(false)
    setTimeout(() => resolve({}), 300)
  }

  const onReload = () => {
    if (webviewRef.current) {
      webviewRef.current.src = app.url
    }
  }

  const onOpenLink = () => {
    window.api.openWebsite(app.url)
  }

  const Title = () => {
    return (
      <TitleContainer style={{ justifyContent: 'space-between' }}>
        <TitleText>{app.name}</TitleText>
        <ButtonsGroup className={isWindows ? 'windows' : ''}>
          <Button onClick={onReload}>
            <ReloadOutlined />
          </Button>
          {canOpenExternalLink && (
            <Button onClick={onOpenLink}>
              <ExportOutlined />
            </Button>
          )}
          <Button onClick={onClose}>
            <CloseOutlined />
          </Button>
        </ButtonsGroup>
      </TitleContainer>
    )
  }

  useEffect(() => {
    const webview = webviewRef.current

    if (webview) {
      const handleNewWindow = (event: any) => {
        event.preventDefault()
        if (webview.loadURL) {
          webview.loadURL(event.url)
        }
      }

      webview.addEventListener('new-window', handleNewWindow)

      return () => {
        webview.removeEventListener('new-window', handleNewWindow)
      }
    }

    return () => {}
  }, [])

  return (
    <Drawer
      title={<Title />}
      placement="bottom"
      onClose={onClose}
      open={open}
      mask={true}
      rootClassName="minapp-drawer"
      maskClassName="minapp-mask"
      height={'100%'}
      maskClosable={false}
      closeIcon={null}
      style={{ marginLeft: 'var(--sidebar-width)' }}>
      <webview src={app.url} ref={webviewRef} style={WebviewStyle} allowpopups={'true' as any} />
    </Drawer>
  )
}

const WebviewStyle: React.CSSProperties = {
  width: 'calc(100vw - var(--sidebar-width))',
  height: 'calc(100vh - var(--navbar-height))',
  backgroundColor: 'white',
  display: 'inline-flex'
}

const TitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: ${isMac ? '20px' : '15px'};
  padding-right: 10px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

const TitleText = styled.div`
  font-weight: bold;
  font-size: 14px;
  color: var(--color-text-1);
  margin-right: 10px;
  user-select: none;
`

const ButtonsGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  -webkit-app-region: no-drag;
  &.windows {
    margin-right: ${isWindows ? '130px' : 0};
    background-color: var(--color-background-mute);
    border-radius: 50px;
    padding: 0 3px;
    overflow: hidden;
  }
`

const Button = styled.div`
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  color: var(--color-text-2);
  transition: all 0.2s ease;
  font-size: 14px;
  &:hover {
    color: var(--color-text-1);
    background-color: var(--color-background-mute);
  }
`

export default class MinApp {
  static topviewId = 0
  static close() {
    TopView.hide('MinApp')
    store.dispatch(setMinappShow(false))
  }
  static start(app: MinAppType) {
    store.dispatch(setMinappShow(true))
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          app={app}
          resolve={(v) => {
            resolve(v)
            this.close()
          }}
        />,
        'MinApp'
      )
    })
  }
}
