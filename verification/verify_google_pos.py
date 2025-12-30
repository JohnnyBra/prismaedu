from playwright.sync_api import sync_playwright

def verify_google_button_position():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:3020")

            # 1. Check Mode Select (Main Screen)
            page.wait_for_selector("text=Soy Profesor")
            print("Main screen loaded.")

            # Ensure Google button is NOT here anymore
            if page.locator("text=Entrar con Google").is_visible():
                print("FAIL: Google button shouldn't be on the main screen.")
            else:
                print("PASS: Google button is not on main screen.")

            # 2. Click "Soy Profesor"
            page.click("text=Soy Profesor")
            print("Clicked 'Soy Profesor'.")

            # 3. Check User Select Screen (Teacher Login)
            # Wait for "Quién eres?" title or similar
            page.wait_for_selector("text=¿Quién eres?")

            # Ensure Google button IS here
            google_btn = page.locator("text=Entrar con Google")
            if google_btn.is_visible():
                print("PASS: Google button is visible in Teacher Login screen.")
            else:
                print("FAIL: Google button NOT found in Teacher Login screen.")

            # Take a screenshot
            page.screenshot(path="verification/teacher_login_screen.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_google_button_position()
