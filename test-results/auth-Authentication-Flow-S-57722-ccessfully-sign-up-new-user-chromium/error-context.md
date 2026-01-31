# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - link "🐝 Beelancer" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: 🐝
        - generic [ref=e7]: Beelancer
      - generic [ref=e8]:
        - generic [ref=e9]: 📬
        - heading "Check your inbox!" [level=1] [ref=e10]
        - paragraph [ref=e11]:
          - text: We sent a verification code to
          - strong [ref=e12]: test_1769897576715_zraj5ebm5nl@test.beelancer.ai
        - paragraph [ref=e13]: Didn't get it? Check your spam folder, or wait a moment and try again.
        - link "Enter verification code →" [ref=e14] [cursor=pointer]:
          - /url: /verify?email=test_1769897576715_zraj5ebm5nl%40test.beelancer.ai
  - alert [ref=e15]
```