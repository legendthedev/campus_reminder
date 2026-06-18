import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.notification_service import get_fcm, send_push_notification


class TestGetFcm:
    @patch("app.services.notification_service.settings")
    def test_returns_none_when_key_empty(self, mock_settings):
        mock_settings.FCM_SERVER_KEY = ""
        assert get_fcm() is None

    @patch("app.services.notification_service.settings")
    def test_returns_none_when_key_is_placeholder(self, mock_settings):
        mock_settings.FCM_SERVER_KEY = "your-firebase-server-key-here"
        assert get_fcm() is None

    @patch("app.services.notification_service.settings")
    @patch("app.services.notification_service.FCMNotification")
    def test_returns_fcm_instance_when_key_set(self, mock_fcm_cls, mock_settings):
        mock_settings.FCM_SERVER_KEY = "real-server-key-123"
        mock_instance = MagicMock()
        mock_fcm_cls.return_value = mock_instance
        result = get_fcm()
        assert result == mock_instance
        mock_fcm_cls.assert_called_once_with(api_key="real-server-key-123")


class TestSendPushNotification:
    @pytest.mark.asyncio
    @patch("app.services.notification_service.get_fcm")
    async def test_returns_false_when_fcm_not_configured(self, mock_get_fcm):
        mock_get_fcm.return_value = None
        result = await send_push_notification("token123", "Title", "Body")
        assert result is False

    @pytest.mark.asyncio
    @patch("app.services.notification_service.get_fcm")
    async def test_returns_false_when_no_token(self, mock_get_fcm):
        mock_get_fcm.return_value = MagicMock()
        result = await send_push_notification("", "Title", "Body")
        assert result is False

    @pytest.mark.asyncio
    @patch("app.services.notification_service.get_fcm")
    async def test_returns_true_on_success(self, mock_get_fcm):
        mock_push = MagicMock()
        mock_push.notify_single_device.return_value = {"success": 1}
        mock_get_fcm.return_value = mock_push
        result = await send_push_notification("valid_token", "Hello", "World")
        assert result is True
        mock_push.notify_single_device.assert_called_once_with(
            registration_id="valid_token",
            message_title="Hello",
            message_body="World",
        )

    @pytest.mark.asyncio
    @patch("app.services.notification_service.get_fcm")
    async def test_returns_false_on_fcm_failure(self, mock_get_fcm):
        mock_push = MagicMock()
        mock_push.notify_single_device.return_value = {"success": 0}
        mock_get_fcm.return_value = mock_push
        result = await send_push_notification("token", "Hi", "Msg")
        assert result is False

    @pytest.mark.asyncio
    @patch("app.services.notification_service.get_fcm")
    async def test_returns_false_on_exception(self, mock_get_fcm):
        mock_push = MagicMock()
        mock_push.notify_single_device.side_effect = Exception("Network error")
        mock_get_fcm.return_value = mock_push
        result = await send_push_notification("token", "Hi", "Msg")
        assert result is False
