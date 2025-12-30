from playwright.sync_api import sync_playwright

def verify_google_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app (assuming 3020 as per index.js log)
            page.goto("http://localhost:3020")

            # Wait for the "Soy Profesor" button to be visible, ensuring page loaded
            page.wait_for_selector("text=Soy Profesor")

            # Check for the Google button
            # It should have text "Entrar con Google"
            google_btn = page.locator("text=Entrar con Google")

            if google_btn.is_visible():
                print("Google button is visible.")
            else:
                print("Google button is NOT visible.")

            # Take a screenshot
            page.screenshot(path="verification/login_screen.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_google_button()
